<#--
  Template HTML do código OTP enviado por e-mail.
  Os parâmetros nomePersona e codigoOtp são fornecidos pelo autenticador.
-->
<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("emailOtpCodeBodyHtml", nomePersona, codigoOtp))?no_esc}
</@layout.emailLayout>