class DashboardPreference < ApplicationRecord
  belongs_to :user
  KINDS = %w[students enrollments pending_admissions groups attendance_chart admission_chart alerts calendar announcements].freeze
  COLUMNS = { "lg" => 12, "md" => 8, "sm" => 4, "xs" => 1 }.freeze
  validate :valid_configuration

  private

  def valid_configuration
    config = configuration
    return errors.add(:configuration, "inválida") unless config.is_a?(Hash) && config.keys.sort == %w[layouts widgets]
    widgets = config["widgets"]
    layouts = config["layouts"]
    return errors.add(:configuration, "inválida") unless widgets.is_a?(Array) && widgets.size <= 24 && layouts.is_a?(Hash)
    valid_widgets = widgets.all? do |widget|
      widget.is_a?(Hash) && widget.keys.sort == %w[id kind title] &&
        widget["id"].is_a?(String) && widget["id"].match?(/\A[a-zA-Z0-9_-]{1,80}\z/) &&
        KINDS.include?(widget["kind"]) && widget["title"].is_a?(String) && widget["title"].length.between?(1, 80)
    end
    return errors.add(:configuration, "widgets inválidos") unless valid_widgets
    ids = widgets.pluck("id")
    errors.add(:configuration, "widgets duplicados") unless ids.uniq == ids
    errors.add(:configuration, "rejilla inválida") unless layouts.keys.sort == COLUMNS.keys.sort && layouts.all? { |key, items| valid_layout?(items, ids, COLUMNS[key]) }
  end

  def valid_layout?(items, ids, columns)
    return false unless items.is_a?(Array) && items.size == ids.size && items.all? { |item| item.is_a?(Hash) && item["i"].is_a?(String) }
    return false unless items.pluck("i").sort == ids.sort
    items.all? do |item|
      item.keys.sort == %w[h i w x y] && %w[x y w h].all? { |key| item[key].is_a?(Integer) } &&
        item["x"] >= 0 && item["y"].between?(0, 10000) && item["w"].between?(1, columns) &&
        item["h"].between?(2, 20) && item["x"] + item["w"] <= columns
    end
  end
end
