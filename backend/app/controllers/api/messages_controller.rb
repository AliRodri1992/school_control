module Api
  class MessagesController < ApplicationController
    rate_limit to: 30, within: 1.minute, only: :create

    def index
      records = InstitutionalMessage.where(sender: current_user).or(InstitutionalMessage.where(recipient: current_user))
      render json: records.includes(:sender, :recipient).order(created_at: :desc).limit(200).map { |record| serialize(record) }
    end

    def recipients
      render json: MessageRecipients.call(current_user).map { |person| person.as_json(only: [ :id, :name, :role ]) }
    end

    def create
      recipient = MessageRecipients.call(current_user).find(params.require(:recipient_id))
      record = InstitutionalMessage.new(params.permit(:subject, :body).merge(sender: current_user, recipient: recipient))
      record.transaction do
        record.save!
        audit(record, "message.created")
      end
      render json: serialize(record), status: :created
    end

    def read
      record = InstitutionalMessage.where(recipient: current_user).find(params[:id])
      record.with_lock do
        unless record.read_at
          record.update!(read_at: Time.current)
          audit(record, "message.read")
        end
      end
      render json: serialize(record)
    end

    private

    def serialize(record)
      record.as_json.merge(sender_name: record.sender.name, recipient_name: record.recipient.name)
    end
  end
end
