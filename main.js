const { Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// main.js
const generateReply = require('./chat');

const wwebVersion = '2.2412.54'; // Replace with a known compatible version

const client = new Client({
    // locking the wweb version
    puppeteer:{
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth({
        dataPath: "sessions"
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});




client.on('message_create' , async (message) => {
    const user_data =  await message.getContact();
    const user = user_data.name;
    console.log(user+" has sent a message");
    const text = message.body;
    
    if (!message.fromMe){
        if(text.includes("@shopping")){
            text_content = text.replace("@shopping","")
            const reply = await  generateReply(msg=text_content,sessionId=user);
            message.reply(reply);
        }
    };

})

client.initialize();
