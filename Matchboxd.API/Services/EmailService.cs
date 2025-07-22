namespace Matchboxd.API.Services;

using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class EmailService
{
    private readonly string _smtpHost = "smtp.gmail.com";
    private readonly int _smtpPort = 587;
    private readonly string _smtpUser = "mazharaltincay89@gmail.com"; 
    private readonly string _smtpPass = "frizsllzmccammrm"; 


    public async Task SendVerificationEmailAsync(string toEmail, string username, string verificationLink)
    {
        var mail = new MailMessage();
        mail.From = new MailAddress(_smtpUser);
        mail.To.Add(toEmail);
        mail.Subject = "Verify your email";
        mail.Body = $"Hi {username},\n\nPlease verify your email by clicking the link below:\n{verificationLink}\n\nThanks!";
        mail.IsBodyHtml = false;

        using var smtpClient = new SmtpClient(_smtpHost, _smtpPort)
        {
            Credentials = new NetworkCredential(_smtpUser, _smtpPass),
            EnableSsl = true
        };

        await smtpClient.SendMailAsync(mail);
    }
}
