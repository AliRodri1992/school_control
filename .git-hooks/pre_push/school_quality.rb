module Overcommit::Hook::PrePush
  class SchoolQuality < Base
    def run
      result = execute(command)
      result.success? ? :pass : [:fail, result.stdout + result.stderr]
    end
  end
end
