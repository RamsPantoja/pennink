type AcceptedBookingRequestEmailTemplateProps = {
	buuddyUserImage: string;
	buuddyName: string;
	link: string;
	buuddyHeadline: string;
};

export const acceptedBookingRequestEmailTemplate = ({
	buuddyName,
	buuddyHeadline,
	buuddyUserImage,
	link,
}: AcceptedBookingRequestEmailTemplateProps) => {
	return `
  <!doctype html>
  <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reject booking request</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossorigin="anonymous"
          />
          <link
              href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
              rel="stylesheet"
          />
      </head>

      <body
          style="
              margin: 0;
              padding: 40px;
              font-family: &quot;Nunito&quot;, sans-serif;
          "
      >
          <div
              class="email_template__content"
              style="
                  border: 2px solid #cba6f7;
                  border-radius: 10px;
                  max-width: 624px;
                  min-width: 624px;
                  margin: 0 auto;
                  text-align: left;
                  text-align: center;
                  position: relative;
              "
          >
              <div
                  class="email_template__header"
                  style="
                      padding: 30px;
                      border-radius: 8px 8px 0 0;
                      display: block;
                      margin: 0;
                      position: relative;
                      background-color: #1e1e2e;
                  "
              >
                  <div class="horizontal__center_img" style="text-align: center">
                      <img
                          class="paddind_img"
                          src="https://firebasestorage.googleapis.com/v0/b/buuddy-3e4d0.appspot.com/o/assets%2Fbuuddy_logotype_nobg.png?alt=media&token=0f131a15-394d-40de-8e41-99f1a6e54fec"
                          width="28px"
                          height="auto"
                          alt="isotipo r3d"
                          style="padding: 0; position: relative; top: 5px"
                      />
                      <p
                          style="
                              color: #cdd6f4;
                              margin: 0;
                              font-weight: 700;
                              font-size: 24px;
                              display: initial;
                          "
                      >
                          buuddy
                      </p>
                  </div>
              </div>
              <div
                  style="
                      border-radius: 0 0 8px 8px;
                      margin: 0 auto;
                      text-align: left;
                      background-color: #181825;
                      padding: 30px;
                  "
              >
                  <h1 style="color: #bac2de; text-align: center; font-size: 24px">
                      Booking Request accepted!
                  </h1>
                  <p style="color: #bac2de; font-size: 14px;text-align: center">
                    Your booking request has been accepted by the buuddy and now you can proceed to the payment.
                  </p>
                  <div style="color: #bac2de; text-align: center">
                      <img
                          src="${buuddyUserImage}"
                          alt="user image"
                          width="60px"
                          height="auto"
                          style="
                              border-radius: 10px;
                              display: inline-block;
                              position: relative;
                              top: 10px;
                          "
                      />
                      <div style="display: inline-block; padding-left: 10px">
                          <p style="margin: 0; font-size: 16px;">
                              <b>${buuddyName}</b>
                          </p>
                          <p style="margin: 0; font-size: 14px">
                              ${buuddyHeadline}
                          </p>
                      </div>
                  </div>
                  <div style="width: 100%;text-align: center; margin-top: 32px;">
                    <a
                        href="${link}"
                        style="
                            display: inline-block;
                            color: #000000;
                            background-color: #cba6f7;
                            padding: 14px;
                            border-radius: 5px;
                            font-weight: 600;
                            margin: 20px 0 20px 0;
                        "
                        >View request and pay!</a
                    >
                  </div>
                  <p style="color: #bac2de; font-size: 14px">
                      If you have any questions or comments, please do not
                      hesitate to contact us.
                  </p>
                  <p style="color: #bac2de; font-size: 14px">Thank you!</p>
              </div>
          </div>
      </body>
  </html>
  `;
};
