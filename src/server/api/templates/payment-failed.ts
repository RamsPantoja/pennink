type Params = {
	linkTo: string;
};

export const paymentFailedTemplate = ({ linkTo }: Params) => `
  <!doctype html>
  <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment method failed</title>
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
                  border: 2px solid #f9dcf8;
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
                      background-color: #ffffff;
                  "
              >
                  <div class="horizontal__center_img" style="text-align: center">
                      <img
                          class="paddind_img"
                          src="https://storage.pennink.xyz/icon.png"
                          width="28px"
                          height="auto"
                          alt="isotipo r3d"
                          style="padding: 0; position: relative; top: 5px"
                      />
                      <p
                          style="
                              color: #000000;
                              margin: 0;
                              font-weight: 700;
                              font-size: 24px;
                              display: initial;
                          "
                      >
                        Pennink
                      </p>
                  </div>
              </div>
              <div
                  style="
                      border-radius: 0 0 8px 8px;
                      margin: 0 auto;
                      text-align: left;
                      background-color: #ffffff;
                      padding: 30px;
                  "
              >
                  <h1 style="color: #4c4f69; font-size: 24px">
                    Payment method failed
                  </h1>
                  <p style="color: #4c4f69; font-size: 14px">
                    The payment to renew your subscription was not completed correctly.
                  </p>
                  <p style="color: #4c4f69; font-size: 14px">
                    We recommend you verify and update your billing details.
                  </p>
                  <a
                      href="${linkTo}"
                      style="
                          display: inline-block;
                          color: #000000;
                          background-color: #f9dcf8;
                          padding: 14px;
                          border-radius: 5px;
                          font-weight: 600;
                          margin: 20px 0 20px 0;
                      "
                      >Go to settings</a
                  >
                  <p style="color: #4c4f69; font-size: 14px">
                      If you have any questions or comments, please do not
                      hesitate to contact us.
                  </p>
                  <a style="color: #4c4f69; font-size: 14px" mailto="hola@pennink.xyz">hola@pennink.xyz</a>
                  <p style="color: #4c4f69; font-size: 14px">Thank you!</p>
              </div>
          </div>
      </body>
  </html>
`;
