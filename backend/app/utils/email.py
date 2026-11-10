import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Adjust SMTP settings for your provider (SendGrid, Mailgun, AWS SES, Gmail SMTP, etc.)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your-email@example.com"
SENDER_PASSWORD = "your-app-password" # Use an App Password, not your plain password

def send_champion_email(customer_email: str, customer_name: str, champion_token: str):
    frontend_base_url = "http://localhost:3000"  # Update with your deployed frontend URL
    champion_link = f"{frontend_base_url}/content-champion/{champion_token}"

    subject = "Welcome! Access Your Content Champion Dashboard"
    
    body = f"""
    Hi {customer_name},

    You've been added as a Content Champion!

    Click the link below to access your custom video selection dashboard:
    {champion_link}

    Best regards,
    The Team
    """

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = customer_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, customer_email, msg.as_string())
        print(f"Successfully sent champion email to {customer_email}")
    except Exception as e:
        print(f"Failed to send email to {customer_email}: {e}")