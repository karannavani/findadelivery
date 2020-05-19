const sendEmail = require('./send-email');
const defaultEnv = process.env;

describe('sendEmail()', () => {
  // TODO: Add tests to check for existence of SendGrid API key

  describe('process.env.PERSONAL_EMAIL = "kane@test.com"', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...defaultEnv, PERSONAL_EMAIL: 'kane@test.com' };
    });

    afterEach(() => {
      process.env = defaultEnv;
    });

    test('Returns a 200 OK if process.env.PERSONAL_EMAIL is found', async () => {
      const response = await sendEmail();
      expect(response.statusCode).toBe(200);
    });
  });


  describe('process.env.PERSONAL_EMAIL is undefined', () => {
    test('Returns a 400 Bad Request if no recipient is found', async () => {
      const response = await sendEmail();

      expect(response.statusCode).toBe(400);
    });

    test('Returns a 200 OK if recipient is found', async () => {
      const response = await sendEmail(['nice_guy_curtis@test.com']);
      expect(response.statusCode).toBe(200);
    });
  });
});
