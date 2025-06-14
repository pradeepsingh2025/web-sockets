module.exports ={
    PORT: process.env.PORT || 3001,
    MONGO_URI : process.env.MONGO_URI || 'mongodb+srv://testingbetapp:Q6dn6jYUk8fptBpZ@cluster0.uwx4bim.mongodb.net/testbet',
    JWT_SECRET: process.env.JWT_SECRET || 'YOUR-SECRET-KEY',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    MIN_DEPOSIT: 100,
    MIN_WITHDRAWAL: 100,
    MAX_WITHDRAWAL: 1000,
    TRANSACTION_TIMEOUT: 24*60*60*1000

}