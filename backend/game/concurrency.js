// Per-team serialization: two teammates on one join code clicking
// "place" at the same instant is a real scenario, and a plain
// find-then-save race would let the second overwrite the first's
// cash deduction (a lost update). Chaining every action for a given
// team onto the same promise forces them to run one at a time, in
// arrival order, without needing a database transaction.
//
// Correctness of this depends on the server running as a single Node
// process for the event -- a second process (PM2 cluster, multiple
// dynos) would have its own independent queue and this guarantee
// would silently stop holding. There's no clustering on this route;
// keep it that way.
const queues = new Map();

function runSerialized(teamId, task) {
  const key = String(teamId);
  const previous = queues.get(key) || Promise.resolve();
  // Swallow the previous task's rejection here only so it can't break
  // the chain for the next one -- the original caller already gets
  // that error from the promise *their* runSerialized() call returned.
  const next = previous.catch(() => {}).then(task);
  queues.set(key, next);
  next.finally(() => {
    if (queues.get(key) === next) queues.delete(key);
  });
  return next;
}

module.exports = { runSerialized };
