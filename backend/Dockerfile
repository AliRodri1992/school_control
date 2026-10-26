FROM ruby:3.4.5-slim
WORKDIR /rails
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential libpq-dev curl libyaml-dev fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install && bundle clean --force
COPY . .
RUN groupadd --system rails && useradd --system --gid rails --create-home rails && mkdir -p tmp/pids log storage && chown -R rails:rails /rails
USER rails
EXPOSE 3000
# Remove a stale Rails server PID only when this container starts, then replace the shell with Puma.
# This also handles a PID left by an interrupted prior run without touching storage volumes.
CMD ["sh", "-c", "rm -f /rails/tmp/pids/server.pid && exec bundle exec rails server -b 0.0.0.0"]
