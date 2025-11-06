# Firebase Password Reset Email Setup Guide

## Why You're Not Receiving Emails

If you're not receiving password reset emails, it's likely because:
1. Email templates are not configured in Firebase Console
2. Email sending is disabled or restricted
3. Emails are going to spam folder
4. The email address doesn't exist in Firebase Auth

## Step-by-Step Setup

### 1. Configure Email Templates in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **guardmogo**
3. Navigate to **Authentication** → **Templates** (or **Settings** → **Email Templates**)
4. Click on **Password reset** template
5. Customize the email template:
   - **Subject**: e.g., "Reset Your GuardMoGo Password"
   - **Body**: Customize the email content
   - **Action URL**: Leave as default or set to your app's URL
6. Click **Save**

### 2. Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Make sure **Email/Password** is enabled
3. Click on **Email/Password** to configure:
   - Enable **Email/Password** (first toggle)
   - Optionally enable **Email link (passwordless sign-in)** if needed
4. Click **Save**

### 3. Configure Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Make sure your domain is listed:
   - `localhost` (for development)
   - Your production domain (e.g., `guardmogo.com`)
3. Add any additional domains if needed

### 4. Check Email Sending Limits

Firebase has email sending limits:
- **Free/Spark Plan**: 100 emails/day
- **Blaze Plan**: Higher limits

If you've exceeded the limit, you'll need to:
- Wait 24 hours, or
- Upgrade to Blaze plan

### 5. Verify Email Sending Status

1. In Firebase Console, go to **Authentication** → **Users**
2. Try sending a password reset email
3. Check the user's email in the list - it should show if emails were sent
4. Check Firebase Console → **Usage** → **Email** to see email sending statistics

### 6. Test the Password Reset Flow

1. Go to your app's sign-in page
2. Enter a valid email address (one that exists in Firebase Auth)
3. Click "Forgot password?"
4. Check:
   - Your inbox (including spam/junk folder)
   - Firebase Console → **Authentication** → **Users** → Check the user's email status

### 7. Custom Email Action Handler (Optional)

If you want to customize the password reset redirect URL:

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Make sure your domain is authorized
3. Update the code in `src/contexts/AuthContext.jsx`:
   ```javascript
   const actionCodeSettings = {
     url: 'https://yourdomain.com/reset-password', // Your production URL
     handleCodeInApp: false,
   }
   ```

### 8. Troubleshooting

**Email not received:**
- Check spam/junk folder
- Verify email address is correct
- Check Firebase Console → **Authentication** → **Users** to see if user exists
- Check Firebase Console → **Usage** → **Email** for sending limits
- Verify email templates are configured

**"User not found" error:**
- The email address must exist in Firebase Authentication
- User must have signed up first

**Email sending disabled:**
- Check Firebase Console → **Authentication** → **Settings**
- Verify email sending is enabled for your project

**Custom domain issues:**
- Make sure your domain is in authorized domains list
- For custom domains, you may need to verify domain ownership

### 9. Alternative: Use Firebase Extensions

If you need more advanced email functionality:
1. Go to Firebase Console → **Extensions**
2. Search for "Email" extensions
3. Install extensions like "Trigger Email" for more control

### 10. Production Checklist

Before going to production:
- [ ] Configure custom email templates
- [ ] Set up authorized domains
- [ ] Test password reset flow
- [ ] Set up custom action handler URL
- [ ] Monitor email sending limits
- [ ] Set up email delivery monitoring

## Quick Test

1. Create a test account in your app
2. Go to sign-in page
3. Click "Forgot password?"
4. Enter the test account's email
5. Check email inbox (including spam)
6. Click the reset link in the email
7. Set a new password
8. Sign in with the new password

## Support

If emails still don't work after following these steps:
1. Check Firebase Console → **Support** for any service issues
2. Review Firebase Console → **Usage** → **Email** for quotas
3. Check browser console for any error messages
4. Verify Firebase project billing status (some features require Blaze plan)

