from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.services.email_service import format_inr

FOUNDER_NAME = "Nithyananthan"
FOUNDER_TITLE = "Founder & CMD, NITECHSPARK"
CONTACT_EMAIL = "nithyananthan@nskgroups.website"
CONTACT_PHONE = "+91-XXXXXXXXXX"


def _wrap_text(text: str, max_chars: int = 80) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 <= max_chars:
            current = f"{current} {word}".strip()
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def generate_proposal_pdf(request, version) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 30 * mm
    line_height = 5 * mm

    def write_line(text: str, bold: bool = False):
        nonlocal y
        if y < 30 * mm:
            c.showPage()
            y = height - 30 * mm
        if bold:
            c.setFont("Helvetica-Bold", 11)
        else:
            c.setFont("Helvetica", 10)
        c.drawString(25 * mm, y, text[:120])
        y -= line_height

    category_label = request.category.replace("_", " ").title()
    client = request.client

    write_line("NITECHSPARK — Project Proposal", bold=True)
    write_line(f"Prepared for: {client.name}")
    if client.company:
        write_line(f"Company: {client.company}")
    write_line(f"Category: {category_label}")
    write_line("")
    write_line(
        f"Budget Estimate: {format_inr(float(version.budget_min))} – {format_inr(float(version.budget_max))}",
        bold=True,
    )
    write_line(f"Timeline: {version.timeline_estimate}")
    write_line("")
    write_line("Scope of Work:", bold=True)
    for item in version.scope_breakdown or []:
        for line in _wrap_text(f"• {item}"):
            write_line(line)
    write_line("")
    write_line("Assumptions:", bold=True)
    for line in _wrap_text(version.assumptions or ""):
        write_line(line)
    write_line("")
    write_line("Exclusions:", bold=True)
    for line in _wrap_text(version.exclusions or ""):
        write_line(line)
    write_line("")
    write_line(
        "This is an AI-generated estimate. Final scope confirmed after founder review post-confirmation."
    )
    write_line("")
    write_line(f"{FOUNDER_NAME}", bold=True)
    write_line(FOUNDER_TITLE)
    write_line(CONTACT_EMAIL)

    c.save()
    buffer.seek(0)
    return buffer
