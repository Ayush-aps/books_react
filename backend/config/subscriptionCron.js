/**
 * Subscription Cron Jobs
 * Netflix-like subscription management: Activate queued subscriptions, handle renewals
 */

const cron = require('node-cron');
const Subscription = require('../models/Subscription');

/**
 * Activate queued subscriptions when start date is reached
 * Runs every day at midnight
 */
const activateQueuedSubscriptions = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running subscription activation job...');
    
    const now = new Date();
    
    // Find subscriptions that should be activated (startDate <= now and not active yet)
    const queuedSubscriptions = await Subscription.find({
      isActive: false,
      startDate: { $lte: now },
    });

    if (queuedSubscriptions.length > 0) {
      console.log(`Found ${queuedSubscriptions.length} queued subscriptions to activate`);
      
      for (const subscription of queuedSubscriptions) {
        subscription.isActive = true;
        await subscription.save();
        console.log(`Activated subscription for user: ${subscription.user}`);
      }
    }
  } catch (error) {
    console.error('Error in subscription activation job:', error);
  }
});

/**
 * Deactivate expired subscriptions
 * Runs every day at 1 AM
 */
const deactivateExpiredSubscriptions = cron.schedule('0 1 * * *', async () => {
  try {
    console.log('Running subscription expiration job...');
    
    const now = new Date();
    
    // Find expired subscriptions
    const expiredSubscriptions = await Subscription.find({
      isActive: true,
      endDate: { $lt: now },
    });

    if (expiredSubscriptions.length > 0) {
      console.log(`Found ${expiredSubscriptions.length} expired subscriptions to deactivate`);
      
      for (const subscription of expiredSubscriptions) {
        // Only deactivate if autoRenew is false
        if (!subscription.autoRenew) {
          subscription.isActive = false;
          await subscription.save();
          console.log(`Deactivated expired subscription for user: ${subscription.user}`);
        } else {
          console.log(`Subscription for user ${subscription.user} has autoRenew enabled - skipping`);
        }
      }
    }
  } catch (error) {
    console.error('Error in subscription expiration job:', error);
  }
});

/**
 * Start all cron jobs
 */
const startSubscriptionJobs = () => {
  console.log('Starting subscription cron jobs...');
  activateQueuedSubscriptions.start();
  deactivateExpiredSubscriptions.start();
  console.log('Subscription cron jobs started successfully');
};

/**
 * Stop all cron jobs
 */
const stopSubscriptionJobs = () => {
  console.log('Stopping subscription cron jobs...');
  activateQueuedSubscriptions.stop();
  deactivateExpiredSubscriptions.stop();
  console.log('Subscription cron jobs stopped');
};

module.exports = {
  startSubscriptionJobs,
  stopSubscriptionJobs,
  activateQueuedSubscriptions,
  deactivateExpiredSubscriptions,
};
