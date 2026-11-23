// Courier SMS payload — posted to the app backend's internal webhook, which
// forwards through its own SMS transport (SMS-Dev in dev, Twilio in prod).
function(ctx) {
  to: ctx.recipient,
  body: ctx.body,
}
