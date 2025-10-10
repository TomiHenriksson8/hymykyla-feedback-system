
import { connectDB, closeDB } from './db/connect';
import SurveyModel from './models/Survey';

async function seed() {
  try {
    await connectDB();

    // Optional: wipe existing surveys for a clean start
    await SurveyModel.deleteMany({});

    const survey = await SurveyModel.create({
      title: 'Peruspalautelomake',
      version: 1,
      isActive: true,
      questions: [
        {
          type: 'scale5',
          prompt: {
            fi: 'Kuinka tyytyväinen olit käyntiisi?',
            en: 'How satisfied were you with your visit?',
            sv: 'Hur nöjd var du med ditt besök?'
          },
          order: 1
        },
        {
          type: 'boolean',
          prompt: {
            fi: 'Oliko henkilökunta ystävällinen?',
            en: 'Was the staff friendly?',
            sv: 'Var personalen vänlig?'
          },
          order: 2
        },
        {
          type: 'text',
          prompt: {
            fi: 'Kerro vapaasti palautteesi',
            en: 'Leave open feedback',
            sv: 'Lämna öppen feedback'
          },
          order: 3,
          maxLength: 600
        }
      ]
    });

    console.log('✅ Seeded survey:', survey._id.toString());
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

seed();
