# Hosted email images

To use linked images in copied invitations, upload `public/factory-sewing.jpg` and `public/sabin-logo-email.png` to permanent, publicly accessible HTTPS addresses on your website. Put their direct URLs into `public/email-images.json` as `factoryPhotoUrl` and `sabinLogoUrl`. No sign-in, cookies, or expiring sharing URLs may be required. Keep these URLs available for as long as recipients may read the invitations.

Configured URLs are used directly in the copied HTML, without downloading and embedding the image bytes. Empty values preserve the local prototype's embedded-image behavior. Email editors may still rewrite pasted images, so verify a sent message in Gmail and Outlook after setting up hosting.

Agent logos uploaded through Choose logo are still embedded. To eliminate those attachments too, the website integration will need to upload agent logos to public image hosting and use the returned URLs. This prototype does not publish uploaded logos.
