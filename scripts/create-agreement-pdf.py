"""Generate the printable agreement from the same reviewed text as the website."""
from pathlib import Path
import json, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
ROOT=Path(__file__).resolve().parent.parent
rows=json.loads((ROOT/'docs/source-content.json').read_text(encoding='utf-8-sig'))['SUPPORT GROUP CONFIDENTIALITY AGREEMENT']
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleHTH',fontName='Helvetica-Bold',fontSize=18,leading=22,textColor=HexColor('#650d29'),spaceAfter=18,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='BodyHTH',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=7))
styles.add(ParagraphStyle(name='HeadHTH',fontName='Helvetica-Bold',fontSize=12,leading=16,textColor=HexColor('#650d29'),spaceBefore=12,spaceAfter=7,keepWithNext=True))
headings={'Support & Education — Not Therapy','Confidentiality','Privacy Outside the Group','Leader & Co-Leaders Exception','CONFIDENTIALITY AGREEMENT','No Recording or Sharing','Limits of Confidentiality','Emergency & Crisis Situations','Personal Responsibility','Respect, Safety & Personal Choice','DISCLAIMER & AGREEMENT','Acknowledgment & Agreement'}
story=[Paragraph('Support Group Confidentiality<br/>and Disclaimer Agreement',styles['TitleHTH'])]
for row in rows[1:]:
 text=html.escape(row).replace('—','-').replace('–','-')
 if row.startswith(('Name (Print):','Member (Signature):','Date:')):continue
 story.append(Paragraph(text,styles['HeadHTH'] if row in headings else styles['BodyHTH']))
story.append(KeepTogether([Spacer(1,14)]+[Paragraph(html.escape(row),styles['BodyHTH']) for row in rows if row.startswith(('Name (Print):','Member (Signature):','Date:'))]))
def footer(canvas,doc):
 canvas.setFont('Helvetica',9);canvas.setFillColor(HexColor('#650d29'));canvas.drawString(48,28,'Heart to Heart: Hope & Healing');canvas.drawRightString(564,28,f'Page {doc.page}')
out=ROOT/'assets/files/support-group-agreement.pdf'
SimpleDocTemplate(str(out),pagesize=(612,792),leftMargin=48,rightMargin=48,topMargin=36,bottomMargin=48,title='Support Group Confidentiality and Disclaimer Agreement',author='Heart to Heart').build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
