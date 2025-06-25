module.exports ={
    PORT: process.env.PORT || 3001,
    MONGO_URI : process.env.MONGO_URI || 'mongodb+srv://testingbetapp:Q6dn6jYUk8fptBpZ@cluster0.uwx4bim.mongodb.net/testbet',
    JWT_SECRET: process.env.JWT_SECRET || '0a2a81b3ef39857b5afaba589b2a47d574a236189c7500566a21eeffcf88e3697358b8f5ab1d47636fb7e87e02f63f93c41a7866db120fd847ab6f1654af1391',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    ADMIN_JWT_SECRET : process.env.ADMIN_JWT_SECRET,
    MIN_DEPOSIT: 100,
    MIN_WITHDRAWAL: 100,
    MAX_WITHDRAWAL: 1000,
    TRANSACTION_TIMEOUT: 24*60*60*1000

}