module.exports = {
    ServerPort : process.env["PORT"] || 8888,
    DatabaseUrl : process.env["MONGODB_URI"] || "mongodb://db-service.infra.svc.cluster.local:27017/infra",
    hostUrl : "http://localhost:" + this.ServerPort,
    DefaultImagePath : "/images/defaultItemImage.jpg",
    salt : "q8w8i8-8y8n8h8q8p8o8",
    secret : "8F8I89878L8-8y8D8I8q8X8",
    telegram_bot_token : "632118782:AAHDAZrR73FipZBEj5c71yzUFI_6ZZwZmoc",
    cloudinary : {
        cloud_name : "daniilzhyrov",
        api_key : "957914163672316",
        api_secret : "nqQOeESc3vkFXpV28NlzUeeGxnE"
    }
}