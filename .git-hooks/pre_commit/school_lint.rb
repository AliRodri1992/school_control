module Overcommit::Hook::PreCommit
  class SchoolLint < Base
    def run
      result = execute(command)
      result.success? ? :pass : [:fail, result.stdout + result.stderr]
    end
  end
end
