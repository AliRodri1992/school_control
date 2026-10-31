# Calculation shared by the student record, report card, academic closure and API.
# SEP 10/09/23: four fields, three terms, integer term marks, one-decimal
# averages for phases 4/5. Decimal treatment is versioned per academic year.
class PrimarySchoolGrading
  def self.decimal(value, mode:)
    number = BigDecimal(value.to_s)
    mode == "round_half_up" ? number.round(1, :half_up) : number.truncate(1)
  end

  def self.report(enrollment:, records: nil)
    evaluations = records || enrollment.formative_evaluations.published.to_a
    year = enrollment.academic_year
    fields = FormativeEvaluation.summary(evaluations, rounding: year.average_decimal_mode)
    complete = fields.all? { |field| field[:final].present? }
    grade = enrollment.group.grade_level
    annual = complete ? decimal(fields.sum { |item| item[:final] } / 4, mode: year.average_decimal_mode) : nil
    # Accreditation is based on the formative fields. First grade passes
    # for having completed the year, not on a numerical threshold.
    accredited = if !complete
      nil
    elsif grade == 1
      true
    else
      fields.all? { |field| field[:final] >= 6 }
    end
    recommendation = if accredited.nil?
      "pending"
    elsif accredited
      grade == 6 ? "graduated" : "promoted"
    else
      "repeat"
    end
    {
      rule_version: year.grading_rule_version,
      average_decimal_mode: year.average_decimal_mode,
      grade_level: grade, fields: fields, complete: complete,
      missing_evaluations: 12 - evaluations.count { |item| item.status == "published" },
      annual_average: annual, accredited: accredited, recommendation: recommendation
    }
  end

  def self.primary_average(enrollments)
    records = enrollments.select { |enrollment| (1..6).cover?(enrollment.group.grade_level) }
    by_grade = records.group_by { |enrollment| enrollment.group.grade_level }
    return nil unless (1..6).all? { |grade| by_grade[grade]&.one? }
    summaries = (1..6).map { |grade| report(enrollment: by_grade.fetch(grade).sole) }
    return nil unless summaries.all? { |item| item[:complete] }
    decimal(summaries.sum { |item| item[:annual_average] } / 6,
      mode: records.last.academic_year.average_decimal_mode)
  end
end
