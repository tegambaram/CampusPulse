import api from './api';

const getAll = async () => (await api.get('/categories')).data;

export default { getAll };
