const sendEmail = require('./send-email');
const sgMail = require('@sendgrid/mail'); // Twilio SendGrid (https://github.com/sendgrid/sendgrid-nodejs)
const addMinutes = require('date-fns/addMinutes');
const defaultEnv = process.env;

jest.mock('@sendgrid/mail');

describe('sendEmail()', () => {
  xdescribe('process.env.SENDGRID_API_KEY does not exist', () => {
    test('Returns a 400 Bad Request if process.env.SENDGRID_API_KEY does not exist', async () => {
      const response = await sendEmail({});
      expect(response.statusCode).toBe(400);
    });
  });

  describe('process.env.PERSONAL_EMAIL = "kane@test.com"', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env = {
        ...defaultEnv,
        PERSONAL_EMAIL: 'kane@test.com',
        // SENDGRID_API_KEY: 'test-api-key'
      };
    });

    afterEach(() => {
      process.env = defaultEnv;
    });

    test('Returns a 400 Bad Request if no vendor is passed', async () => {
      const response = await sendEmail({});
      expect(response.statusCode).toBe(400);
    });

    test('Returns a 200 OK if vendor is passed', async () => {
      const response = await sendEmail({ vendor: 'AMAZON' });
      expect(response.statusCode).toBe(200);
    });

    describe('details exists', () => {
      describe('timeSlot exists', () => {
        test('Returns a 400 Bad Request if an invalid timeSlot is passed', async () => {
          const vendor = 'ASDA';
          const details = {
            timeSlot: ['startDate', 'endDate'] // This time slot is invalid because it contains strings, not Date objs
          }; 

          const response = await sendEmail({ vendor, details });

          expect(response.statusCode).toBe(400);
        });

        test('Returns a 400 Bad Request if an invalid timeSlot is passed', async () => {
          const vendor = 'ASDA';
          const details = {
            timeSlot:['startDate', new Date()]
          };

          const response = await sendEmail({ vendor, details });

          expect(response.statusCode).toBe(400);
        });

        test('Returns a 200 OK if a valid timeSlot is passed', async () => {
          const vendor = 'ASDA';
          const startDate = new Date();
          const endDate = addMinutes(startDate, 30);
          const details = {
            timeSlot: [startDate, endDate]
          };

          const response = await sendEmail({ vendor, details });

          expect(response.statusCode).toBe(200);
        });
      });

      describe('merchantId exists', () => {
        test('Returns a 200 OK if vendor and merchantId is passed', async () => {
          const vendor = 'AMAZON';
          const details = {
            merchantId: "A3L2WCBX4NBSPG" 
          }
          const response = await sendEmail({ vendor, details });
          expect(response.statusCode).toBe(200);
        });

      });
    });
  });


  describe('process.env.PERSONAL_EMAIL is undefined', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env = {
        ...defaultEnv,
        // SENDGRID_API_KEY: 'test-api-key'
      };
    });

    afterEach(() => {
      process.env = defaultEnv;
    });

    test('Returns a 400 Bad Request if no email address is found', async () => {
      const response = await sendEmail({ vendor: 'ASDA' });
      expect(response.statusCode).toBe(400);
    });
    
    test('Returns a 400 Bad Request if email address is found but no vendor is passed', async () => {
      const addresses = [
        'nice_guy_curtis@test.com',
        'nicer_guy_karan@test.com'
      ];

      const response = await sendEmail({ addresses });

      expect(response.statusCode).toBe(400);
    });

    test('Returns a 200 OK if address is found', async () => {
      const vendor = 'ASDA';
      const addresses = [
        'nice_guy_curtis@test.com',
        'nicer_guy_karan@test.com'
      ];

      const response = await sendEmail({ vendor, addresses });

      expect(response.statusCode).toBe(200);
    });
  });
});
