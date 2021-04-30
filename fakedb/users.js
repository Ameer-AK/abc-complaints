module.exports = {
   users: [
    {id: 123, email: 'ameer@hotmail.com', password: 'abc123'},
    {id: 456, email: 'ameera@hotmail.com', password: 'abc123'}
    ],
    getAll() { return this.users }
};
