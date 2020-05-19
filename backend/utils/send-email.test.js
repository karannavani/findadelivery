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

    test('Returns a 400 Bad Request if no vendor is passed', async () => {
      const response = await sendEmail(null);
      expect(response.statusCode).toBe(400);
    });

    test('Returns a 200 OK if vendor is passed', async () => {
      const response = await sendEmail('ASDA');
      expect(response.statusCode).toBe(200);
    });
  });


  describe('process.env.PERSONAL_EMAIL is undefined', () => {
    test('Returns a 400 Bad Request if no email address is found', async () => {
      const vendor = 'ASDA';
      const response = await sendEmail(vendor, null);

      expect(response.statusCode).toBe(400);
    });
    
    test('Returns a 400 Bad Request if email address is found but no vendor is passed', async () => {
      const addresses = [
        'nice_guy_curtis@test.com',
        'nicer_guy_karan@test.com'
      ];

      const response = await sendEmail(null, addresses);

      expect(response.statusCode).toBe(400);
    });

    test('Returns a 200 OK if address is found', async () => {
      const vendor = 'ASDA';
      const addresses = [
        'nice_guy_curtis@test.com',
        'nicer_guy_karan@test.com'
      ];

      const response = await sendEmail(vendor, addresses);

      expect(response.statusCode).toBe(200);
    });
  });
});
