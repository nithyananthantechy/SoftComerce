import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

MAX_VERSIONS = 4
LOCKED_MESSAGE = (
    "Let's finalize this together — our founder will personally review your requirement."
)

# Keywords that indicate the client wants a live meeting/call instead of another AI proposal
MEETING_KEYWORDS = [
    "live call", "live meeting", "video call", "voice call", "phone call",
    "schedule a call", "schedule a meeting", "book a call", "book a meeting",
    "want to meet", "need to meet", "meet with", "call me", "call us",
    "zoom", "google meet", "teams call", "whatsapp call",
    "demo", "live demo", "screen share", "in person",
    "direct contact", "speak to someone", "talk to someone", "talk to a person",
]


def detect_meeting_request(text: str) -> bool:
    """Returns True if the feedback text mentions a desire for a live meeting or call."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in MEETING_KEYWORDS)


def format_inr(amount: float) -> str:
    return f"&#8377;{amount:,.0f}"


# ─── Shared email wrapper ──────────────────────────────────────────────────────

def _email_wrapper(header_color: str, header_emoji: str, header_title: str, body_html: str, footer_html: str = "") -> str:
    """Wraps email content in a consistent, professional table-based layout."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{header_title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Top brand bar -->
          <tr>
            <td style="background-color:#0f172a;padding:14px 32px;text-align:left;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#3b82f6;border-radius:6px;padding:4px 10px;margin-right:10px;">
                    <span style="color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:1px;">SK</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#94a3b8;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">NITECHSPARK &middot; Softkart</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero header -->
          <tr>
            <td style="background-color:{header_color};padding:36px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">{header_emoji}</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">{header_title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
              {footer_html}
              <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">
                &copy; {2026} Softkart &mdash; Software Hub by NITECHSPARK
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _client_info_table(client, category: str) -> str:
    """Renders a styled client info table."""
    category_label = category.replace("_", " ").title()
    category_colors = {
        "mobile": ("#dbeafe", "#1d4ed8", "📱"),
        "web": ("#d1fae5", "#065f46", "🌐"),
        "custom_software": ("#ede9fe", "#5b21b6", "⚙️"),
    }
    bg, fg, icon = category_colors.get(category, ("#f1f5f9", "#334155", "💼"))

    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
  <tr>
    <td style="background-color:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Client Information</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding:5px 0;color:#475569;font-size:14px;"><strong style="color:#0f172a;">Name</strong></td>
          <td width="50%" style="padding:5px 0;color:#475569;font-size:14px;">{client.name}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#475569;font-size:14px;"><strong style="color:#0f172a;">Email</strong></td>
          <td style="padding:5px 0;font-size:14px;"><a href="mailto:{client.email}" style="color:#3b82f6;text-decoration:none;">{client.email}</a></td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#475569;font-size:14px;"><strong style="color:#0f172a;">Phone</strong></td>
          <td style="padding:5px 0;color:#475569;font-size:14px;">{client.phone or "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#475569;font-size:14px;"><strong style="color:#0f172a;">Company</strong></td>
          <td style="padding:5px 0;color:#475569;font-size:14px;">{client.company or "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#475569;font-size:14px;"><strong style="color:#0f172a;">Category</strong></td>
          <td style="padding:5px 0;">
            <span style="background-color:{bg};color:{fg};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">{icon} {category_label}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""


def _proposal_card(version, show_feedback: bool = True) -> str:
    """Renders a single proposal version as a styled card."""
    budget_str = (
        f"{format_inr(float(version.budget_min))} &ndash; {format_inr(float(version.budget_max))}"
        if version.budget_min is not None and version.budget_max is not None
        else "N/A"
    )
    timeline = version.timeline_estimate or "N/A"

    # Scope items
    scope_items = ""
    for item in version.scope_breakdown or []:
        scope_items += f"""
        <tr>
          <td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="10" valign="top" style="padding-top:6px;">
                <div style="width:6px;height:6px;border-radius:50%;background-color:#3b82f6;"></div>
              </td>
              <td style="padding-left:10px;color:#475569;font-size:13px;line-height:1.5;">{item}</td>
            </tr></table>
          </td>
        </tr>"""

    feedback_html = ""
    if show_feedback and version.client_feedback:
        feedback_html = f"""
        <div style="background-color:#fef3c7;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:14px;">
          <p style="margin:0;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Client Feedback</p>
          <p style="margin:5px 0 0;color:#78350f;font-size:13px;">{version.client_feedback}</p>
        </div>"""

    assumptions_html = ""
    if version.assumptions:
        assumptions_html = f"""
        <div style="background-color:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 6px 6px 0;padding:10px 14px;margin-top:12px;">
          <p style="margin:0;color:#0c4a6e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">&#128204; Assumptions</p>
          <p style="margin:6px 0 0;color:#0369a1;font-size:13px;line-height:1.5;">{version.assumptions}</p>
        </div>"""

    exclusions_html = ""
    if version.exclusions:
        exclusions_html = f"""
        <div style="background-color:#fff1f2;border-left:3px solid #f43f5e;border-radius:0 6px 6px 0;padding:10px 14px;margin-top:8px;">
          <p style="margin:0;color:#881337;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">&#128683; Exclusions</p>
          <p style="margin:6px 0 0;color:#be123c;font-size:13px;line-height:1.5;">{version.exclusions}</p>
        </div>"""

    return f"""
<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:16px;">
  <!-- Version header -->
  <div style="background-color:#0f172a;padding:14px 18px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Version {version.version_number}</span>
        </td>
        <td align="right">
          <span style="color:#f8fafc;font-size:15px;font-weight:700;">{budget_str}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <span style="color:#64748b;font-size:12px;">&#9200; {timeline}</span>
        </td>
      </tr>
    </table>
  </div>
  <!-- Version body -->
  <div style="padding:16px 18px;background-color:#ffffff;">
    {feedback_html}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">&#128230; Scope</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      {scope_items if scope_items else '<tr><td style="color:#94a3b8;font-size:13px;font-style:italic;">No scope items</td></tr>'}
    </table>
    {assumptions_html}
    {exclusions_html}
  </div>
</div>"""


def _cta_button(href: str, label: str, color: str = "#0f172a") -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
  <tr>
    <td align="center">
      <a href="{href}" style="background-color:{color};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;display:inline-block;letter-spacing:0.5px;">
        {label} &rarr;
      </a>
    </td>
  </tr>
</table>"""


# ─── Send helpers ──────────────────────────────────────────────────────────────

async def send_email(subject: str, html_body: str) -> str:
    if settings.smtp_host and settings.smtp_user:
        return await _send_smtp(subject, html_body)
    if settings.sendgrid_api_key:
        return await _send_sendgrid(subject, html_body)
    logger.warning("No email provider configured — email not sent: %s", subject)
    return "skipped_no_config"


async def _send_smtp(subject: str, html_body: str) -> str:
    # Use MIMEMultipart so clients always render HTML
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.from_email
    msg["To"] = settings.admin_email

    # Plain-text fallback (stripped)
    plain = (
        subject + "\n\n"
        "This email contains HTML formatting. Please view it in an HTML-capable email client."
    )
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )
    return "sent"


async def _send_sendgrid(subject: str, html_body: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [{"to": [{"email": settings.admin_email}]}],
                "from": {"email": settings.from_email},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_body}],
            },
        )
        resp.raise_for_status()
    return "sent"


async def send_email_to_user(to_email: str, subject: str, html_body: str) -> str:
    if settings.smtp_host and settings.smtp_user:
        return await _send_smtp_to_user(to_email, subject, html_body)
    if settings.sendgrid_api_key:
        return await _send_sendgrid_to_user(to_email, subject, html_body)
    logger.warning("No email provider configured — email not sent to %s: %s", to_email, subject)
    return "skipped_no_config"


async def _send_smtp_to_user(to_email: str, subject: str, html_body: str) -> str:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.from_email
    msg["To"] = to_email

    plain = (
        subject + "\n\n"
        "This email contains HTML formatting. Please view it in an HTML-capable email client."
    )
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )
    return "sent"


async def _send_sendgrid_to_user(to_email: str, subject: str, html_body: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": settings.from_email},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_body}],
            },
        )
        resp.raise_for_status()
    return "sent"


# ─── Alert functions ───────────────────────────────────────────────────────────

async def send_confirmation_alert(db, request) -> str:
    from app.models import Alert

    client = request.client
    latest = request.proposal_versions[-1] if request.proposal_versions else None
    dashboard_link = f"{settings.frontend_url}/admin/requests/{request.id}"
    category_label = request.category.replace("_", " ").title()

    proposal_section = _proposal_card(latest, show_feedback=False) if latest else (
        "<p style='color:#94a3b8;font-style:italic;'>No proposal on file.</p>"
    )

    body_html = f"""
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a;">
      A client just confirmed their proposal! &#127881;
    </h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      <strong style="color:#0f172a;">{client.name}</strong> from
      <strong style="color:#0f172a;">{client.company or "N/A"}</strong>
      has reviewed and confirmed the {category_label} proposal.
      Please reach out to them to kick off the project.
    </p>

    {_client_info_table(client, request.category)}

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Confirmed Proposal</p>
    {proposal_section}

    {_cta_button(dashboard_link, "Open in Admin Dashboard", "#10b981")}
    """

    footer_html = f"""
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
      &#10003; Proposal confirmed &mdash; {category_label} project &mdash; {client.name}
    </p>"""

    html_body = _email_wrapper(
        header_color="#059669",
        header_emoji="🎉",
        header_title="New Confirmed Project",
        body_html=body_html,
        footer_html=footer_html,
    )

    subject = f"✅ Confirmed: {client.name} — {category_label} Project"
    status = await send_email(subject, html_body)

    alert = Alert(request_id=request.id, alert_type="confirmed", email_status=status)
    db.add(alert)
    db.commit()
    return status


async def send_human_review_alert(db, request) -> str:
    from app.models import Alert

    client = request.client
    dashboard_link = f"{settings.frontend_url}/admin/requests/{request.id}"
    category_label = request.category.replace("_", " ").title()
    version_count = len(request.proposal_versions)

    # Build proposal history cards
    proposal_history = ""
    for v in request.proposal_versions:
        proposal_history += _proposal_card(v, show_feedback=True)

    body_html = f"""
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">
      Founder Action Required &#128276;
    </h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      <strong style="color:#0f172a;">{client.name}</strong> from
      <strong style="color:#0f172a;">{client.company or "N/A"}</strong>
      has gone through <strong>{version_count} proposal versions</strong>
      without confirming. The AI has reached its limit — this client needs a
      personal touch from you.
    </p>

    <!-- Alert box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" style="font-size:20px;padding-right:12px;">⚠️</td>
              <td>
                <p style="margin:0;color:#92400e;font-size:13px;font-weight:700;">Requires Personal Follow-Up</p>
                <p style="margin:6px 0 0;color:#78350f;font-size:13px;line-height:1.5;">
                  The client has reached the maximum of {MAX_VERSIONS} AI-generated proposals without confirming.
                  Please review their requirements personally and reach out directly to close the deal.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    {_client_info_table(client, request.category)}

    <!-- Quick action buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:8px;" width="50%">
          <a href="mailto:{client.email}?subject=Re: Your {category_label} Proposal — Let's Talk&body=Hi {client.name},%0A%0AI've reviewed your project requirements for a {category_label} solution and would love to discuss this further.%0A%0ABest,%0ANitechspark Team"
             style="display:block;text-align:center;background-color:#3b82f6;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:8px;">
            ✉️ Email Client
          </a>
        </td>
        <td style="padding-left:8px;" width="50%">
          <a href="tel:{client.phone or ''}"
             style="display:block;text-align:center;background-color:#0f172a;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:8px;">
            📞 Call {client.phone or "N/A"}
          </a>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">
      Full Proposal History ({version_count} versions)
    </p>
    {proposal_history}

    {_cta_button(dashboard_link, "Review in Admin Dashboard", "#f59e0b")}
    """

    footer_html = f"""
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
      &#128680; Human review needed &mdash; {category_label} &mdash; {client.name}
    </p>"""

    html_body = _email_wrapper(
        header_color="#d97706",
        header_emoji="🤝",
        header_title="Founder Review Required",
        body_html=body_html,
        footer_html=footer_html,
    )

    subject = f"⚠️ Review Needed: {client.name} — {category_label} ({version_count} proposals)"
    status = await send_email(subject, html_body)

    alert = Alert(request_id=request.id, alert_type="needs_human_review", email_status=status)
    db.add(alert)
    db.commit()
    return status


async def send_meeting_request_alert(db, request, feedback_text: str) -> str:
    """Fires when a client explicitly asks for a live call or meeting in their feedback."""
    from app.models import Alert

    client = request.client
    dashboard_link = f"{settings.frontend_url}/admin/requests/{request.id}"
    category_label = request.category.replace("_", " ").title()
    latest = request.proposal_versions[-1] if request.proposal_versions else None

    budget_str = (
        f"{format_inr(float(latest.budget_min))} &ndash; {format_inr(float(latest.budget_max))}"
        if latest and latest.budget_min is not None and latest.budget_max is not None
        else "N/A"
    )

    body_html = f"""
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">
      Client Wants a Live Meeting &#128222;
    </h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      <strong style="color:#0f172a;">{client.name}</strong> from
      <strong style="color:#0f172a;">{client.company or "N/A"}</strong>
      has requested a <strong>live call or meeting</strong> instead of another AI-generated proposal.
      Please reach out to them directly to schedule a discussion.
    </p>

    <!-- What they said -->  
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;border-left:4px solid #0ea5e9;padding:16px 20px;">
          <p style="margin:0 0 6px;color:#0c4a6e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">&#128172; What the client said</p>
          <p style="margin:0;color:#0369a1;font-size:14px;line-height:1.6;font-style:italic;">&ldquo;{feedback_text}&rdquo;</p>
        </td>
      </tr>
    </table>

    {_client_info_table(client, request.category)}

    <!-- Proposal snapshot -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Current Proposal (v{latest.version_number if latest else "N/A"})</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#475569;font-size:13px;padding:4px 0;"><strong>Budget:</strong></td>
              <td style="color:#0f172a;font-size:14px;font-weight:700;padding:4px 0;">{budget_str}</td>
            </tr>
            <tr>
              <td style="color:#475569;font-size:13px;padding:4px 0;"><strong>Timeline:</strong></td>
              <td style="color:#475569;font-size:13px;padding:4px 0;">{latest.timeline_estimate if latest else "N/A"}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Quick action buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:8px;" width="50%">
          <a href="mailto:{client.email}?subject=Your%20{category_label}%20Project%20%E2%80%94%20Let%27s%20Schedule%20a%20Call&body=Hi%20{client.name}%2C%0A%0AThank%20you%20for%20your%20interest%20in%20a%20live%20meeting.%20I%27d%20love%20to%20connect%20and%20discuss%20your%20{category_label}%20requirements%20in%20detail.%0A%0AWhat%20time%20works%20best%20for%20you%3F%0A%0ABest%2C%0ANitechspark%20Team"
             style="display:block;text-align:center;background-color:#3b82f6;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:8px;">
            &#10003; Reply to Schedule
          </a>
        </td>
        <td style="padding-left:8px;" width="50%">
          <a href="tel:{client.phone or ''}"
             style="display:block;text-align:center;background-color:#7c3aed;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:8px;">
            &#128222; Call {client.phone or "N/A"}
          </a>
        </td>
      </tr>
    </table>

    {_cta_button(dashboard_link, "View Full Request in Dashboard", "#0f172a")}
    """

    footer_html = f"""
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
      &#128222; Meeting requested &mdash; {category_label} &mdash; {client.name}
    </p>"""

    html_body = _email_wrapper(
        header_color="#7c3aed",
        header_emoji="📞",
        header_title="Client Wants a Live Meeting",
        body_html=body_html,
        footer_html=footer_html,
    )

    subject = f"📞 Meeting Requested: {client.name} — {category_label}"
    status = await send_email(subject, html_body)

    # Re-use needs_human_review alert type so it shows in admin dashboard
    alert = Alert(request_id=request.id, alert_type="needs_human_review", email_status=status)
    db.add(alert)
    db.commit()
    return status


async def send_otp_email(to_email: str, otp: str, purpose: str) -> str:
    subject = f"🔐 Verification Code: {otp}"
    body_html = f"""
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a;">
      Your Verification Code
    </h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      You requested a code to <strong>{purpose}</strong>.
    </p>
    <div style="background-color:#f1f5f9;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;border:1px solid #e2e8f0;">
      <span style="font-size:36px;font-weight:bold;color:#0f172a;letter-spacing:6px;font-family:monospace;">{otp}</span>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
      This code is valid for 15 minutes. If you did not request this verification, you can safely ignore this email.
    </p>
    """
    html_body = _email_wrapper(
        header_color="#3b82f6",
        header_emoji="🔐",
        header_title="Verification Code",
        body_html=body_html
    )
    return await send_email_to_user(to_email, subject, html_body)
