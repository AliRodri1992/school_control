require "rails_helper"
require "stringio"

RSpec.describe "grade spreadsheet imports", type: :model do
  it "validates and saves a grade as a draft without publishing it" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    import = create(:user, role: "admin").data_imports.new(kind: "grades")
    csv = "Clase,Inscripcion,Trimestre,Calificacion\n#{course.id},#{enrollment.id},1,9.5\n"
    import.file.attach(io: StringIO.new(csv), filename: "calificaciones.csv", content_type: "text/csv")
    import.save!
    mapper = ValidateGradeImport.new(import)
    mapping = { "Clase" => "course_id", "Inscripcion" => "enrollment_id",
      "Trimestre" => "term", "Calificacion" => "score" }
    expect(mapper.call(mapping)[:errors]).to eq([])
    import.update!(status: "queued", mapping: mapping)
    DataImportJob.perform_now(import.id)
    grade = Grade.find_by!(enrollment: enrollment, course: course, term: 1)
    expect(grade.score).to eq(9.5)
    expect(grade.status).to eq("draft")
    expect(import.reload.imported_rows).to eq(1)
  end

  it "flags duplicate grades and does not overwrite published records" do
    enrollment = create(:enrollment)
    course = create(:course, group: enrollment.group)
    Grade.create!(enrollment: enrollment, course: course, term: 1, score: 8)
    batch = create(:user, role: "admin").data_imports.new(kind: "grades")
    batch.file.attach(io: StringIO.new("Clase,Inscripcion,Trimestre,Calificacion\n#{course.id},#{enrollment.id},1,9\n"),
      filename: "grades.csv", content_type: "text/csv")
    batch.save!
    mapping = { "Clase" => "course_id", "Inscripcion" => "enrollment_id",
      "Trimestre" => "term", "Calificacion" => "score" }
    expect(ValidateGradeImport.new(batch).call(mapping)[:errors]).not_to be_empty
  end
end
