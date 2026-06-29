import prisma from '../config/db.js';

let lastCheckedTime = 0;

/**
 * Automatically check and update status of expired TRIAL and ACTIVE subscriptions.
 * Throttled to once every 60 seconds to avoid unnecessary DB load.
 */
export const checkAndUpdateSubscriptions = async () => {
  const now = new Date();
  
  // Throttling to run at most once per 60 seconds
  if (now.getTime() - lastCheckedTime < 60000) {
    return;
  }
  lastCheckedTime = now.getTime();

  try {
    // 1. Find all expired TRIAL subscriptions and mark them EXPIRED
    const expiredTrials = await prisma.subscription.updateMany({
      where: {
        status: 'TRIAL',
        trial_end_date: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // 2. Find all expired ACTIVE subscriptions and mark them EXPIRED
    const expiredActives = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        expired_date: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (expiredTrials.count > 0 || expiredActives.count > 0) {
      console.log(`🔄 Auto-expired subscriptions: ${expiredTrials.count} Trials, ${expiredActives.count} Actives.`);
    }
  } catch (error) {
    console.error('❌ Error auto-updating expired subscriptions:', error);
  }
};
