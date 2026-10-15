const mongoose = require('mongoose');

function transactionsUnsupported(error) {
  const message = String(error?.message || '');
  return error?.code === 20 || /replica set|transaction numbers/i.test(message);
}

/**
 * Runs work inside a MongoDB transaction when the server is a replica set
 * (Atlas, or a local replica set). Standalone mongod cannot do transactions,
 * so the same work runs as ordinary writes in that case.
 */
async function withOptionalTransaction(work) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    if (transactionsUnsupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
}

function bind(query, session) {
  return session ? query.session(session) : query;
}

module.exports = { withOptionalTransaction, bind };
