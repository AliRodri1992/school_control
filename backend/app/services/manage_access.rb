class ManageAccess
  def self.transaction
    AccessRole.transaction do
      AccessRole.connection.execute("SELECT pg_advisory_xact_lock(730023)")
      result = yield
      ensure_manager!
      result
    end
  end

  def self.ensure_manager!
    managers = User.where(active: true).joins(access_roles: :role_permissions)
      .where(access_roles: { active: true }, role_permissions: { key: "access_roles.update" }).distinct
    unless managers.any? { |user| user.can?("access_roles.assign") }
      raise ArgumentError, "Debe permanecer una cuenta activa capaz de administrar y asignar permisos"
    end
  end

  def self.verify_grants!(actor, permissions)
    own = actor.effective_permissions
    permissions.each do |grant|
      key, scope = grant.fetch(:key), grant.fetch(:data_scope)
      unless PermissionCatalog.scopes(key).include?(scope)
        raise ArgumentError, "Permiso o ámbito inválido: #{key}"
      end
      unless own.fetch(key, []).include?("institution") || own.fetch(key, []).include?(scope)
        raise ArgumentError, "No puedes conceder permisos fuera de tu autoridad: #{key}"
      end
    end
    keys = permissions.map { |grant| grant[:key] }
    permissions.each do |grant|
      if grant[:key].start_with?("report_") && !keys.include?("reports.index")
        raise ArgumentError, "Activa también el centro de reportes"
      end
      mod, action = grant[:key].split(".")
      if action != "index" && PermissionCatalog::ACTIONS.fetch(mod).include?("index") && !keys.include?("#{mod}.index")
        raise ArgumentError, "Activa también el acceso a #{mod}"
      end
    end
  end

  def self.save_role(role:, actor:, attributes:, permissions:, expected_version: nil)
    transaction do
      raise ArgumentError, "Sin permiso para administrar roles" unless actor.can?(role.persisted? ? "access_roles.update" : "access_roles.create")
      verify_grants!(actor, permissions)
      if role.persisted?
        role.reload
        raise ArgumentError, "El rol cambió. Actualiza la pantalla." unless role.lock_version == Integer(expected_version)
        # Editing or deactivating a more powerful role is also a privilege change.
        verify_grants!(actor, role.role_permissions.map { |p| { key: p.key, data_scope: p.data_scope } })
      end
      role.assign_attributes(attributes.slice(:name, :description, :active))
      role.save!
      role.role_permissions.destroy_all
      permissions.each { |grant| role.role_permissions.create!(grant) }
      role.touch # Include permission-only changes in optimistic concurrency control.
      AuditEvent.create!(user: actor, action: "access_role.saved", record_type: "AccessRole", record_id: role.id,
        changes_summary: { permissions: permissions })
      role
    end
  end

  def self.assign(user:, actor:, role_ids:)
    transaction do
      raise ArgumentError, "Sin permiso para asignar roles" unless actor.can?("access_roles.assign")
      roles = AccessRole.where(id: role_ids, active: true).to_a
      raise ArgumentError, "Selecciona roles activos válidos" unless roles.map(&:id).sort == role_ids.map(&:to_i).uniq.sort
      (roles + user.access_roles.to_a).uniq.each do |role|
        verify_grants!(actor, role.role_permissions.map { |p| { key: p.key, data_scope: p.data_scope } })
      end
      user.access_roles = roles
      AuditEvent.create!(user: actor, action: "access_role.assigned", record_type: "User", record_id: user.id,
        changes_summary: { access_role_ids: roles.map(&:id) })
      user
    end
  end
end
