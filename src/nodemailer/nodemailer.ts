import NodeMailer from 'nodemailer';

const transporter = NodeMailer.createTransport({
    service: process.env.SERVICE,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAILPASSWORD
    }
})

export const sendMessage = (email:string) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Регистрация в Last Raid',
        text: 'Работает'
    }
    

    transporter.sendMail(mailOptions, function(error:any, info:any) {
        if(error) {
            console.log(error);
        } else console.log(info.response);
    })
}

