import * as db from '../data/localDb';

const getAll = async () => {
  await db.ready();
  return db.getAll('categories');
};

export default { getAll };
