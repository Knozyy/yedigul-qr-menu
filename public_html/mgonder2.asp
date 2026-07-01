 <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-9" />
<Meta Http-Equiv="Content-Type" Content="text/html; charset=windows-1254">
<globalization requestEncoding="ISO-8859-9" responseEncoding="ISO-8859-9" fileEncoding="ISO-8859-9" /> 
<link href="css/style.css" rel="stylesheet">

<% @ Language = VBScript CodePage=1254 %>
 <title>Yedigül Restaurant Subscribe</title>
 <style type="text/css">
body {
	background-image: url(marka.jpg);
}
</style>
<%
Session.CodePage = 1254
Session.LCID = 1055
%>
<%Response.Charset="ISO-8859-1"
Response.Charset="Windows-1254"
response.ContentType="text/HTML"
%>
<%if not request.QueryString("giris")="serbest" then 
%>
<script language="JavaScript" type="text/javascript">
 <!--
window.opener = self;
 window.close();
 // -->
 </script> 

<%else%>
<%if not request.form("gizli")="" then
response.redirect"index.html"
else
%>
<% if request.form("email")="" then
%>
<br />
<br />
<br />
<br />
<br />

<center><font face="verdana" size="+1" color="#000000"><b>Email Adresi Girmemişsiniz.Lütfen Giriniz.</b></font></center>
<%response.End
end if%>
<%FUNCTION KONTROL(STR) 
ET = INSTR(2, STR , "@" ) 
IF ET = VBISNULL THEN
KONTROL = FALSE
ELSE 
ETK = ET
ET = TRUE 
END IF 
IF ET = TRUE THEN 
NKT = INSTR(ETK + 2, STR , "." ) 
IF NKT = VBISNULL THEN
KONTROL = FALSE 
ELSE
KONTROL = TRUE 
END IF
ELSE
KONTROL = FALSE 
END IF
END FUNCTION 

email = trim(request.form("email"))
if not KONTROL(email) then
%>


<br />
<br />
<br />
<br />
<br />

<center><font face="verdana" size="+1" color="#000000"><b>Geçerli Bir Email Adresi Giriniz.</b></font></center>
<%response.End
end if%>
<% if request.form("email")="" then
%>
<br />
<br />
<br />
<br />
<br />

<center><font face="verdana" size="+1" color="#000000"><b>Email Girmemişsiniz.Lütfen Giriniz.</b></font></center>
<%response.End
end if%>

<%
Session.Codepage = 1254
On Error Resume Next
Dim SMTPSunucuAdresi
Dim SMTPKullaniciAdi
Dim Sifre
Dim AliciKisi
Dim MailKonusu
Dim Mesaj
Dim MKonf
Dim Alnlr
Dim CDOM

///////////////////////////////////////////////////////////
/////ALTTAKi KULLANICI ADI ve SiFRENiZi DOLDURUNUZ/////////
///////////////////////////////////////////////////////////

  SMTPKullaniciAdi	= "mail@yedigul.com"
  SMTPSifre		= "PAROLA_KALDIRILDI_ROTATE_EDILDI"
  Gidecek_Mail_adresi	= "mail@yedigul.com"
  SMTPSunucuAdresi	= "smtp.yedigul.com"
  DomainAdi		= "yedigul.com"	//www olmadan yaziniz.

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////


SMTPSunucuAdresi	= "smtp."+DomainAdi
GonderenAdSoyad		= SMTPKullaniciAdi
GonderenKisi		= SMTPKullaniciAdi
AliciKisi		= Gidecek_Mail_adresi
MailKonusu		= "Subscribe"
Mesaj			="<b>E-mail&nbsp;:&nbsp;</b>" +Request.Form("email")
%>

<!--
body {
	background-color: #F0F0F0;
}
-->
</style>

<%
Set MKonf = CreateObject("CDO.Configuration")
Sch = "http://schemas.microsoft.com/cdo/configuration/" 
	Set Alnlr = MKonf.Fields
		With Alnlr
		                                   .Item(Sch & "sendusing")                       = 2
                                   .Item(Sch & "smtpserver")                    = SMTPSunucuAdresi
                                               .Item(Sch & "smtpserverport")                = 587
                                               .Item(Sch & "smtpauthenticate") = 1
                                               .Item(Sch & "sendusername") = SMTPKullaniciAdi
                                               .Item(Sch & "sendpassword")  = SMTPSifre
                                               .Update
                               End With


Set CDOM = CreateObject("CDO.Message")
	CDOM.Configuration	= MKonf
	CDOM.From		= GonderenAdSoyad & "<" & GonderenKisi & ">"
	CDOM.To			= AliciKisi
	CDOM.Subject		= MailKonusu
	CDOM.HtmlBody		= Mesaj
	CDOM.Send

Set CDOM	= Nothing	
Set Alnlr	= Nothing
Set MKonf	= Nothing

if err Then
		Response.write err.description
		Response.end
		cdoSys = false
	else
		
End If
%><br />
<br />
<br />
<br />
<br />

<center><font face="verdana" size="+1" color="#000000"><b>Mail Adresiniz Kaydedilmiştir.İndirim, Kampanya ve Özel Koşullar Oldukça Bilgilendirileceksiniz.</b></font></center>
<script language="JavaScript" type="text/javascript">
 <!--
window.opener = self;
 window.close();
 // -->
 </script> 
<%end if%>
<%end if%>