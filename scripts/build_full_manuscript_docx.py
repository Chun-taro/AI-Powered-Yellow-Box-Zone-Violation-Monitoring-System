import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import re
import sys

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def format_latex_math(expr):
    expr = expr.strip()
    
    known_replacements = {
        r'\text{Detection Success Rate (DSR)} = \left( \frac{\text{Correctly Detected Traversals}}{\text{Total Ground-Truth Traversals}} \right) \times 100\%':
            'Detection Success Rate (DSR) = (Correctly Detected Traversals / Total Ground-Truth Traversals) × 100%',
        r'P = \frac{\text{TP}}{\text{TP} + \text{FP}}':
            'Operational Precision (P) = TP / (TP + FP)',
        r'R = \frac{\text{TP}}{\text{TP} + \text{FN}}':
            'Operational Recall (R) = TP / (TP + FN)',
        r'\text{F1-Score} = 2 \times \frac{P \times R}{P + R}':
            'F1-Score = 2 × (P × R) / (P + R)',
        r'P_{\text{ref}} = \left( \frac{x_1 + x_2}{2}, y_2 \right) = (x_0, y_0)':
            'P_ref = ((x1 + x2) / 2, y2) = (x0, y0)',
        r'\text{Ray}(t) = (x_0 + t, y_0), \quad t \ge 0':
            'Ray(t) = (x0 + t, y0),  t ≥ 0',
        r'P_{\text{ref}} \in V \iff \left( \sum_{i=1}^{4} \text{Intersect}(e_i) \right) \equiv 1 \pmod 2':
            'P_ref ∈ V  ⟺  [∑ Intersect(e_i)] ≡ 1 (mod 2)',
        r'D(o_i, c_j) = \sqrt{(x_{o_i} - x_{c_j})^2 + (y_{o_i} - y_{c_j})^2}':
            'D(o_i, c_j) = √((x_oi - x_cj)² + (y_oi - y_cj)²)',
        r'\text{TCR} = \frac{\text{Successfully Maintained Tracks}}{\text{Total Tracked Vehicles}} \times 100\%':
            'Tracking Continuity Rate (TCR) = (Successfully Maintained Tracks / Total Tracked Vehicles) × 100%',
        r'\Delta d_t = \sqrt{(x_t - x_{t-1})^2 + (y_t - y_{t-1})^2} < \epsilon_{\text{movement}} \quad (\epsilon_{\text{movement}} = 4.0\text{ px})':
            'Δd_t = √((x_t - x_t-1)² + (y_t - y_t-1)²) < ϵ_movement  (ϵ_movement = 4.0 px)',
        r'\Delta t_{\text{stop}} = t_{\text{current}} - t_{\text{start}}':
            'Δt_stop = t_current - t_start',
        r'\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|':
            'MAE = (1 / n) ∑ |y_i - ŷ_i|',
        r'\Delta E^* = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}':
            'ΔE* = √((ΔL*)² + (Δa*)² + (Δb*)²)',
        r'W(c) = \sum_{t=1}^{T} \gamma^{T - t} \cdot \mathbb{I}(c_t = c)':
            'W(c) = ∑ [γ^(T - t) · I(c_t = c)]  (where γ = 0.9)',
        r'\bar{x} = \frac{\sum_{i=1}^{N} x_i}{N}':
            'Weighted Composite Mean: x̄ = (∑ x_i) / N',
        r's = \sqrt{\frac{\sum_{i=1}^{N} (x_i - \bar{x})^2}{N - 1}}':
            'Sample Standard Deviation: s = √([∑ (x_i - x̄)²] / (N - 1))'
    }

    if expr in known_replacements:
        return known_replacements[expr]
    
    if 'Intersect(e_i)' in expr or 'cases' in expr:
        return 'Intersect(e_i) = 1  if  (y_i > y0) ≠ (y_i+1 > y0)  and  x0 < [(x_i+1 - x_i)(y0 - y_i) / (y_i+1 - y_i)] + x_i;  else  0'

    t = expr
    t = re.sub(r'\\frac\{([^{}]+)\}\{([^{}]+)\}', r'(\1 / \2)', t)
    t = t.replace(r'\text{', '').replace(r'}', '')
    t = t.replace(r'\left(', '(').replace(r'\right)', ')')
    t = t.replace(r'\left[', '[').replace(r'\right]', ']')
    t = t.replace(r'\times', '×').replace(r'\ge', '≥').replace(r'\le', '≤')
    t = t.replace(r'\Delta', 'Δ').replace(r'\epsilon', 'ϵ').replace(r'\gamma', 'γ')
    t = t.replace(r'\bar{x}', 'x̄').replace(r'\hat{y}', 'ŷ')
    t = t.replace(r'\in', '∈').replace(r'\iff', '⟺').replace(r'\sum', '∑').replace(r'\sqrt', '√')
    t = t.replace(r'\quad', ' ').replace(r'\%', '%').replace(r'\cdot', '·')
    t = t.replace(r'\mathbb{I}', 'I').replace(r'\pmod', 'mod')
    t = t.replace('^2', '²')
    return t

def clean_md_inline(text):
    text = re.sub(r'\$([^\$]+)\$', lambda m: format_latex_math(m.group(1)), text)
    text = text.replace(r'\_', '_')
    text = text.replace(r'\times', '×').replace(r'\ge', '≥').replace(r'\le', '≤')
    text = text.replace(r'\Delta', 'Δ').replace(r'\epsilon', 'ϵ').replace(r'\tau', 'τ').replace(r'\gamma', 'γ')
    text = text.replace(r'\bar{x}', 'x̄').replace(r'\hat{y}', 'ŷ')
    text = text.replace(r'\%', '%')
    return text

def add_styled_paragraph(doc, text, style_name="Normal", space_after=6, space_before=0, align=WD_ALIGN_PARAGRAPH.LEFT, line_spacing=1.15):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.line_spacing = line_spacing

    parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', text)
    for part in parts:
        if not part: continue
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(clean_md_inline(part[2:-2]))
            run.font.bold = True
            run.font.name = "Times New Roman"
        elif part.startswith('*') and part.endswith('*'):
            run = p.add_run(clean_md_inline(part[1:-1]))
            run.font.italic = True
            run.font.name = "Times New Roman"
        elif part.startswith('`') and part.endswith('`'):
            run = p.add_run(part[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(10)
        else:
            run = p.add_run(clean_md_inline(part))
            run.font.name = "Times New Roman"

    if style_name.startswith("Heading 1"):
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(8)
        for r in p.runs:
            r.font.size = Pt(13)
            r.font.bold = True
            r.font.color.rgb = RGBColor(30, 41, 59)
    elif style_name.startswith("Heading 2"):
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        for r in p.runs:
            r.font.size = Pt(12)
            r.font.bold = True
            r.font.color.rgb = RGBColor(30, 41, 59)
    elif style_name.startswith("Heading 3"):
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.size = Pt(11.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(51, 65, 85)
    elif style_name.startswith("Heading 4"):
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        for r in p.runs:
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.italic = True
            r.font.color.rgb = RGBColor(71, 85, 105)
    elif style_name == "Title":
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(12)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = RGBColor(15, 23, 42)
    elif style_name == "Indicator":
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Inches(0.2)
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(37, 99, 235)
    elif style_name == "Formula":
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = RGBColor(30, 41, 59)
    elif style_name == "Blockquote":
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.right_indent = Inches(0.4)
        p.paragraph_format.space_after = Pt(6)
        for r in p.runs:
            r.font.italic = True
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(55, 65, 81)
    else:
        for r in p.runs:
            if not r.font.size:
                r.font.size = Pt(11)

    return p

def add_table_from_md_lines(doc, table_lines):
    rows_data = []
    for line in table_lines:
        line_clean = line.strip()
        if not line_clean.startswith('|') or not line_clean.endswith('|'):
            continue
        cells = [c.strip() for c in line_clean.split('|')[1:-1]]
        if all(re.match(r'^:?-+:?$', c) for c in cells):
            continue
        rows_data.append(cells)

    if not rows_data:
        return

    num_rows = len(rows_data)
    num_cols = max(len(r) for r in rows_data)

    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for r_idx, row in enumerate(rows_data):
        is_header = (r_idx == 0)
        for c_idx in range(num_cols):
            cell = table.cell(r_idx, c_idx)
            cell_text = row[c_idx] if c_idx < len(row) else ""
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.05

            if is_header:
                set_cell_background(cell, "1E293B")
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                if r_idx % 2 == 1:
                    set_cell_background(cell, "FFFFFF")
                else:
                    set_cell_background(cell, "F8FAFC")

            cell_text = cell_text.replace('<br>', '\n').replace('<br/>', '\n')
            parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*)', cell_text)
            for part in parts:
                if not part: continue
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(clean_md_inline(part[2:-2]))
                    run.font.bold = True
                elif part.startswith('*') and part.endswith('*'):
                    run = p.add_run(clean_md_inline(part[1:-1]))
                    run.font.italic = True
                else:
                    run = p.add_run(clean_md_inline(part))
                
                run.font.name = "Times New Roman"
                if is_header:
                    run.font.bold = True
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    run.font.size = Pt(9)
                    run.font.color.rgb = RGBColor(15, 23, 42)

    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(6)
    sp.paragraph_format.space_before = Pt(0)

def build_docx_from_md(md_path, docx_path):
    print(f"Reading markdown from {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    lines = md_text.split('\n')
    doc = docx.Document()

    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    in_table = False
    current_table = []
    in_code_block = False
    code_block_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_block_lines = []
            else:
                in_code_block = False
                if code_block_lines:
                    bp = doc.add_paragraph()
                    bp.paragraph_format.left_indent = Inches(0.3)
                    bp.paragraph_format.right_indent = Inches(0.3)
                    bp.paragraph_format.space_before = Pt(4)
                    bp.paragraph_format.space_after = Pt(6)
                    run = bp.add_run("\n".join(code_block_lines))
                    run.font.name = "Consolas"
                    run.font.size = Pt(9)
                    run.font.color.rgb = RGBColor(71, 85, 105)
                code_block_lines = []
            i += 1
            continue

        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        if stripped.startswith('|') and stripped.endswith('|'):
            if not in_table:
                in_table = True
                current_table = [line]
            else:
                current_table.append(line)
            i += 1
            continue
        else:
            if in_table:
                add_table_from_md_lines(doc, current_table)
                in_table = False
                current_table = []

        if not stripped:
            i += 1
            continue

        if stripped in ['---', '***', '___']:
            i += 1
            continue

        if stripped.startswith('$$') and stripped.endswith('$$') and len(stripped) > 2:
            math_expr = format_latex_math(stripped[2:-2].strip())
            add_styled_paragraph(doc, math_expr, style_name="Formula", space_after=6, space_before=4)
            i += 1
            continue

        if stripped.startswith('# '):
            add_styled_paragraph(doc, stripped[2:], style_name="Title", align=WD_ALIGN_PARAGRAPH.CENTER)
        elif stripped.startswith('## '):
            add_styled_paragraph(doc, stripped[3:], style_name="Heading 1")
        elif stripped.startswith('### '):
            add_styled_paragraph(doc, stripped[4:], style_name="Heading 2")
        elif stripped.startswith('#### '):
            add_styled_paragraph(doc, stripped[5:], style_name="Heading 3")
        elif stripped.startswith('##### ') or stripped.startswith('###### '):
            h_text = stripped.lstrip('#').strip()
            add_styled_paragraph(doc, h_text, style_name="Heading 4")
        elif stripped.startswith('> '):
            add_styled_paragraph(doc, stripped[2:], style_name="Blockquote")
        elif stripped.startswith('[Screenshot Indicator:'):
            add_styled_paragraph(doc, stripped, style_name="Indicator")
        elif re.match(r'^\*Figure \d+-\d+\.', stripped) or re.match(r'^\*\*Figure \d+-\d+\.', stripped):
            add_styled_paragraph(doc, stripped, style_name="Normal", space_after=6, space_before=2)
        elif stripped.startswith('- ') or stripped.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            content_text = stripped[2:]
            parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', content_text)
            for part in parts:
                if not part: continue
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(clean_md_inline(part[2:-2]))
                    run.font.bold = True
                elif part.startswith('*') and part.endswith('*'):
                    run = p.add_run(clean_md_inline(part[1:-1]))
                    run.font.italic = True
                elif part.startswith('`') and part.endswith('`'):
                    run = p.add_run(part[1:-1])
                    run.font.name = "Consolas"
                    run.font.size = Pt(9.5)
                else:
                    run = p.add_run(clean_md_inline(part))
                run.font.name = "Times New Roman"
                if not run.font.size: run.font.size = Pt(11)
        elif re.match(r'^\d+\.\s+', stripped):
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            content_text = re.sub(r'^\d+\.\s+', '', stripped)
            parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', content_text)
            for part in parts:
                if not part: continue
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(clean_md_inline(part[2:-2]))
                    run.font.bold = True
                elif part.startswith('*') and part.endswith('*'):
                    run = p.add_run(clean_md_inline(part[1:-1]))
                    run.font.italic = True
                elif part.startswith('`') and part.endswith('`'):
                    run = p.add_run(part[1:-1])
                    run.font.name = "Consolas"
                    run.font.size = Pt(9.5)
                else:
                    run = p.add_run(clean_md_inline(part))
                run.font.name = "Times New Roman"
                if not run.font.size: run.font.size = Pt(11)
        else:
            add_styled_paragraph(doc, stripped, style_name="Normal", space_after=6)

        i += 1

    if in_table:
        add_table_from_md_lines(doc, current_table)

    print(f"Saving compiled docx to {docx_path}...")
    doc.save(docx_path)
    print("Successfully built docx!")

if __name__ == '__main__':
    build_docx_from_md(
        'docs/Revised_Research_Paper.md',
        'docs/AI-Powered-Yellow-Box-Zone-Violation-Monitoring-System-Using-AI-Based-Camera-Detection-3.docx'
    )
