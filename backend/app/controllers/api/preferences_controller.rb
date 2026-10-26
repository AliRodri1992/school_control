module Api
  class PreferencesController < ApplicationController
    skip_before_action :authorize_permission

    def show
      render json: show_preferences
    end

    def update
      preference = record
      attrs = params.permit(:locale, :theme, :rows_per_page, :selected_child_id, :time_format, :date_format, :week_start, :table_density, :reduce_motion, :high_contrast, :large_text, :hide_sensitive_data, :hide_notification_previews, :remember_filters, :notification_email, :notification_school, :notification_grades, :notification_attendance, :notification_events, :notification_digest, :calendar_view, :preferred_group_id)
      preference.update!(attrs)
      render json: show_preferences
    end

    private

    def record
      @record ||= UserPreference.find_or_create_by!(user: current_user)
    end

    def show_preferences
      record.as_json(only: %i[locale theme rows_per_page selected_child_id time_format date_format week_start table_density reduce_motion high_contrast large_text hide_sensitive_data hide_notification_previews remember_filters notification_email notification_school notification_grades notification_attendance notification_events notification_digest calendar_view preferred_group_id updated_at])
    end
  end
end
