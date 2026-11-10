# -*- coding: utf-8 -*-
"""Build the mid-term requirements conception and SRS document."""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUTPUT = Path(__file__).resolve().parent.parent / "个人工作生活管理系统_需求构思与需求规格说明书.docx"

BODY_FONT = "Microsoft YaHei"
MONO_FONT = "Consolas"
BLACK = RGBColor(0x00, 0x00, 0x00)
DARK_GRAY = RGBColor(0x40, 0x40, 0x40)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
HEADER_FILL = "1F3864"
ALT_FILL = "F2F5FA"
BORDER_COLOR = "D9D9D9"

CONTENT_WIDTH = 6.5


def set_run_font(run, name=BODY_FONT, size=10.5, bold=False, color=BLACK):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    rfonts.set(qn("w:eastAsia"), name)


def set_style_font(style, name=BODY_FONT, size=10.5, bold=False, color=BLACK):
    style.font.name = name
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = color
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    rfonts.set(qn("w:eastAsia"), name)


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_width(cell, width):
    cell.width = Inches(width)
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width * 1440)))
    tc_w.set(qn("w:type"), "dxa")


def set_table_borders(table):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), BORDER_COLOR)
        borders.append(element)
    tbl_pr.append(borders)


def set_table_cell_margins(table):
    tbl_pr = table._tbl.tblPr
    margins = OxmlElement("w:tblCellMar")
    for side, value in (("top", 70), ("left", 100), ("bottom", 70), ("right", 100)):
        element = OxmlElement(f"w:{side}")
        element.set(qn("w:w"), str(value))
        element.set(qn("w:type"), "dxa")
        margins.append(element)
    tbl_pr.append(margins)


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def set_repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    tr_pr.append(repeat)


def format_cell_text(cell, text, bold=False, color=BLACK, size=9, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    paragraph = cell.paragraphs[0]
    paragraph.alignment = align
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = 1.15
    run = paragraph.add_run(str(text))
    set_run_font(run, size=size, bold=bold, color=color)


TABLE_COUNTER = [0]


def add_table(
    doc,
    caption,
    headers,
    rows,
    widths,
    aligns=None,
    font_size=9,
    keep_together=False,
):
    TABLE_COUNTER[0] += 1
    caption_paragraph = doc.add_paragraph()
    caption_paragraph.paragraph_format.space_before = Pt(8)
    caption_paragraph.paragraph_format.space_after = Pt(4)
    caption_paragraph.paragraph_format.keep_with_next = True
    caption_run = caption_paragraph.add_run(f"表 {TABLE_COUNTER[0]}  {caption}")
    set_run_font(caption_run, size=9.5, bold=True, color=BLACK)

    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    set_table_cell_margins(table)

    header_row = table.rows[0]
    set_repeat_header(header_row)
    set_row_cant_split(header_row)
    for index, header in enumerate(headers):
        cell = header_row.cells[index]
        set_cell_width(cell, widths[index])
        shade_cell(cell, HEADER_FILL)
        align = WD_ALIGN_PARAGRAPH.CENTER if (aligns is None or aligns[index] == "center") else WD_ALIGN_PARAGRAPH.LEFT
        format_cell_text(cell, header, bold=True, color=WHITE, size=font_size, align=align)

    for row_index, row_values in enumerate(rows):
        row = table.add_row()
        set_row_cant_split(row)
        for col_index, value in enumerate(row_values):
            cell = row.cells[col_index]
            set_cell_width(cell, widths[col_index])
            if row_index % 2 == 1:
                shade_cell(cell, ALT_FILL)
            align = WD_ALIGN_PARAGRAPH.CENTER if (aligns and aligns[col_index] == "center") else WD_ALIGN_PARAGRAPH.LEFT
            format_cell_text(cell, value, size=font_size, align=align)

    if keep_together:
        for row in table.rows[:-1]:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.keep_with_next = True
    else:
        for row in table.rows[:3]:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.keep_with_next = True

    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(4)
    spacer.paragraph_format.line_spacing = 1.0
    return table


def body(doc, text, bold_lead=None, space_after=6):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(space_after)
    paragraph.paragraph_format.line_spacing = 1.5
    if bold_lead:
        lead = paragraph.add_run(bold_lead)
        set_run_font(lead, size=10.5, bold=True, color=BLACK)
    run = paragraph.add_run(text)
    set_run_font(run, size=10.5, color=BLACK)
    return paragraph


def bullet(doc, text):
    paragraph = doc.add_paragraph(style="List Bullet")
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(3)
    paragraph.paragraph_format.line_spacing = 1.35
    run = paragraph.add_run(text)
    set_run_font(run, size=10.5, color=BLACK)
    return paragraph


def heading(doc, text, level=1, page_break_before=False):
    paragraph = doc.add_heading(level=level)
    paragraph.paragraph_format.page_break_before = page_break_before
    run = paragraph.add_run(text)
    if level == 1:
        set_run_font(run, size=16, bold=True, color=BLACK)
        paragraph.paragraph_format.space_before = Pt(18)
        paragraph.paragraph_format.space_after = Pt(8)
    elif level == 2:
        set_run_font(run, size=13, bold=True, color=BLACK)
        paragraph.paragraph_format.space_before = Pt(13)
        paragraph.paragraph_format.space_after = Pt(5)
    else:
        set_run_font(run, size=11.5, bold=True, color=BLACK)
        paragraph.paragraph_format.space_before = Pt(9)
        paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def add_page_field(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(end)
    set_run_font(run, size=9, color=DARK_GRAY)


def add_toc_field(doc):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = ' TOC \\o "1-2" \\h \\z \\u '
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "目录将在打开文档时自动更新"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(separate)
    run._r.append(placeholder)
    run._r.append(end)


def add_toc_title(doc):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.page_break_before = True
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(12)
    run = paragraph.add_run("目录")
    set_run_font(run, size=16, bold=True, color=BLACK)
    return paragraph


def setup_document():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.different_first_page_header_footer = True

    normal = doc.styles["Normal"]
    set_style_font(normal, size=10.5)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(6)

    for style_name, size, bold in (
        ("Heading 1", 16, True),
        ("Heading 2", 13, True),
        ("Heading 3", 11.5, True),
    ):
        style = doc.styles[style_name]
        set_style_font(style, size=size, bold=bold, color=BLACK)
        style.element.get_or_add_rPr()
        color = style.element.rPr.find(qn("w:color"))
        if color is not None:
            color.set(qn("w:val"), "000000")
        for attr in ("w:themeColor", "w:themeShade", "w:themeTint"):
            if color is not None and color.get(qn(attr)) is not None:
                del color.attrib[qn(attr)]

    footer = section.footer
    footer_paragraph = footer.paragraphs[0]
    footer_paragraph.paragraph_format.tab_stops.add_tab_stop(Inches(CONTENT_WIDTH), WD_TAB_ALIGNMENT.RIGHT)
    left = footer_paragraph.add_run("个人工作生活管理系统")
    set_run_font(left, size=9, color=DARK_GRAY)
    footer_paragraph.add_run("\t")
    page_label = footer_paragraph.add_run("第 ")
    set_run_font(page_label, size=9, color=DARK_GRAY)
    add_page_field(footer_paragraph)
    page_suffix = footer_paragraph.add_run(" 页")
    set_run_font(page_suffix, size=9, color=DARK_GRAY)
    return doc


def add_cover(doc):
    for _ in range(3):
        doc.add_paragraph()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(14)
    run = title.add_run("个人工作生活管理系统")
    set_run_font(run, size=24, bold=True, color=BLACK)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.paragraph_format.space_after = Pt(10)
    run = subtitle.add_run("需求构思与需求规格说明书")
    set_run_font(run, size=18, bold=True, color=BLACK)

    purpose = doc.add_paragraph()
    purpose.alignment = WD_ALIGN_PARAGRAPH.CENTER
    purpose.paragraph_format.space_after = Pt(48)
    run = purpose.add_run("中期检查自查材料")
    set_run_font(run, size=12, color=BLACK)

    info_rows = [
        ("项目名称", "个人工作生活管理系统（工作生活专属 App）"),
        ("文档版本", "V1.0"),
        ("文档状态", "中期检查自查稿"),
        ("编制日期", "2026 年 11 月 10 日"),
        ("应用形态", "单用户、本地离线、桌面浏览器应用"),
        ("技术路线", "React 18 + TypeScript + IndexedDB"),
    ]
    table = doc.add_table(rows=0, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    set_table_cell_margins(table)
    for index, (label, value) in enumerate(info_rows):
        row = table.add_row()
        set_row_cant_split(row)
        set_cell_width(row.cells[0], 1.35)
        set_cell_width(row.cells[1], 4.65)
        shade_cell(row.cells[0], "E8EDF5")
        if index % 2 == 1:
            shade_cell(row.cells[1], ALT_FILL)
        format_cell_text(row.cells[0], label, bold=True, size=10)
        format_cell_text(row.cells[1], value, size=10)

def add_toc_page(doc):
    add_toc_title(doc)
    body(doc, "本文档分为两部分。第一部分说明需求如何形成，第二部分给出可用于开发、验收和中期自查的需求规格。")
    add_toc_field(doc)


def add_part_one(doc):
    heading(doc, "第一部分  需求构思及描述", level=1, page_break_before=True)

    heading(doc, "1  项目缘起与问题分析", level=2)
    body(
        doc,
        "日常工作和生活信息分散在任务清单、备忘录、聊天记录、电子表格、健身应用和游戏平台中。"
        "每换一个工具就要重新录入一次，真正需要回顾时，又很难把今天要做什么、项目还差什么、"
        "上次咨询答应跟进什么、今天训练完成没有放在一起看。问题不在某一个工具不好用，"
        "而在于信息之间没有联系。",
    )
    body(
        doc,
        "第二个问题是隐私和依赖。很多在线工具需要登录、联网和云端同步，个人咨询记录、客户信息和开发计划"
        "并不适合无条件上传。对于只在一个人的电脑上使用的场景，引入账号体系和云服务反而增加了风险和操作步骤。",
    )
    body(
        doc,
        "第三个问题是模块同质化。市面上不少全能工具最终都变成同一套任务列表换了不同名字：健身没有组数和重量，"
        "饮食没有餐次和饮水，咨询没有客户时间线，游戏没有时长和评分。这样的工具看似覆盖很多场景，"
        "实际每个场景都要用户自己想办法将就。",
    )
    body(
        doc,
        "因此，本项目的基本判断是：需要一个只在自己电脑浏览器中运行、数据不上传、每个模块按自身业务建模、"
        "模块之间又能互相联动的个人管理系统。",
    )

    heading(doc, "2  目标用户与使用情境", level=2)
    body(
        doc,
        "目标用户是单一用户本人，同时承担开发、咨询、自媒体创作、健身、饮食管理和游戏娱乐等多类事务。"
        "用户以 Windows 电脑和桌面浏览器为主要使用环境，重视数据隐私和离线可用，愿意自己维护和备份数据，"
        "不需要多人协作和手机端。",
    )
    add_table(
        doc,
        "典型使用情境",
        ["使用情境", "用户行为", "系统支撑"],
        [
            ("早晨开始一天", "打开首页，看今天要做什么", "今日概览、今日计划、模块摘要"),
            ("工作中产生想法", "随手记一条备忘、任务或选题", "全局快速记录、快速备忘"),
            ("开发推进", "管理项目、待办、Bug、日志和里程碑", "开发工作"),
            ("咨询结束", "记录要点并生成下次跟进", "咨询工作"),
            ("训练时", "按计划逐组打卡并记录实际重量", "健身计划"),
            ("安排饮食", "记录三餐、加餐和饮水", "饮食计划"),
            ("休息娱乐", "记录游玩时长、评分和想玩清单", "游戏娱乐"),
            ("定期维护", "导出备份、导入恢复、清理数据", "数据与设置"),
        ],
        [1.25, 2.45, 2.8],
        ["left", "left", "left"],
        keep_together=True,
    )

    heading(doc, "3  需求构思过程", level=2)
    body(
        doc,
        "需求不是先列功能再找场景，而是沿着一天的使用轨迹逐步收敛。先把发生频率高、容易丢失、"
        "需要跨天回顾的事情列出来，再把这些事情归并成可以独立维护的模块，最后定义模块之间的共同单位。",
    )
    for item in (
        "按时间线收集场景：早晨查看、工作中记录、开发推进、咨询跟进、训练、饮食、娱乐、定期备份。",
        "把场景归并成九个模块：首页、今日计划、自媒体、开发、咨询、健身、饮食、游戏娱乐、数据与设置。",
        "为每个模块确定最小业务对象：内容、项目、客户、训练、餐次、游戏，而不是统一使用任务对象。",
        "用事项作为跨模块的共同单位：各模块可以把记录加入今日计划，今日计划只保存引用和当天执行信息。",
        "先定义数据归属和同步规则，再设计页面：来源模块保留业务数据，首页只做聚合，今日计划负责当天执行。",
        "用可验证的验收标准反推需求：每条需求都要能用一次实际操作或一段自动化测试判断通过或不通过。",
    ):
        bullet(doc, item)
    body(
        doc,
        "其中最关键的决定是首页不保存业务数据。首页只读取今日计划和各模块数据，因此不会出现同一件事存两份、"
        "两边状态不一致的问题。今日计划保存自己新建的日程和待办，以及指向模块记录的引用；"
        "自媒体、开发、咨询、健身、饮食和游戏模块继续保存各自的完整业务数据。",
    )

    heading(doc, "4  功能构思", level=2)
    body(
        doc,
        "九个模块分别回答一个具体问题，模块之间只通过今日计划和首页摘要发生联系。这样的划分既保证每个模块"
        "有足够的业务深度，也避免把所有功能堆进同一个任务列表。",
    )
    add_table(
        doc,
        "功能模块构思",
        ["模块", "要解决的问题", "核心能力", "与其他模块的关系"],
        [
            ("首页总览", "今天做什么，各模块有什么关注点", "今日概览、今日计划、快速备忘、模块摘要", "聚合今日计划和六个业务模块"),
            ("今日计划", "今天先做什么，未完成怎么办", "日程、待办、优先级、排序、完成、顺延", "承接各模块加入今日的事项"),
            ("自媒体", "选题、进度和发布效果", "账号栏目、四状态看板、发布数据", "计划发布事项加入今日"),
            ("开发工作", "项目进展、待办和 Bug", "项目、待办、Bug、日志、里程碑", "待办加入今日"),
            ("咨询工作", "客户、上次咨询和下次跟进", "客户档案、咨询时间线、跟进、结算", "跟进事项加入今日"),
            ("健身计划", "训练安排、打卡和身体变化", "训练计划、周安排、逐组打卡、身体数据", "训练安排加入今日"),
            ("饮食计划", "三餐加餐和饮水", "三餐加餐、常用食物、复制、饮水", "饮食记录加入今日"),
            ("游戏娱乐", "游戏库、游玩时长和清单", "游戏库、状态、游玩时长、评分、娱乐清单", "独立模块，向首页提供摘要"),
            ("数据与设置", "备份恢复和数据偏好", "导出、导入、回滚点、清理、偏好", "管理全部模块的数据和设置"),
        ],
        [0.95, 1.75, 2.1, 1.7],
        ["left", "left", "left", "left"],
        font_size=8.5,
    )

    heading(doc, "5  核心业务闭环", level=2)
    body(
        doc,
        "需求是否成立，最终要看用户能否完成一条完整的业务闭环。以下六条闭环覆盖了第一版的主要使用价值。",
    )
    add_table(
        doc,
        "核心业务闭环",
        ["闭环", "起点", "中间过程", "终点"],
        [
            ("灵感到发布", "快速备忘或灵感", "转为选题、创作、待发布、加入今日", "完成发布并记录数据"),
            ("开发推进", "项目", "待办、Bug、日志、里程碑、加入今日", "完成待办或修复 Bug"),
            ("咨询跟进", "客户", "咨询记录、下一步、跟进待办、加入今日", "完成跟进并更新结算"),
            ("训练执行", "训练计划", "本周安排、今日训练、逐组打卡", "生成训练历史和身体数据"),
            ("饮食记录", "每日餐次", "三餐加餐、常用食物、饮水", "完成当日饮食记录"),
            ("数据安全", "日常使用", "自动保存、导出备份、导入恢复", "数据可恢复、可迁移"),
        ],
        [1.0, 1.15, 2.55, 1.8],
        ["left", "left", "left", "left"],
    )
    body(
        doc,
        "跨模块闭环的统一机制是加入今日。每条来自模块的事项记录来源类型、来源 ID 和日期，同一来源同一天只允许"
        "存在一条今日引用。今日计划勾选完成时，来源模块同步完成；来源模块内部完成时，今日计划同步完成。"
        "删除来源记录时清理今日引用，删除今日引用则不删除来源记录。",
    )

    heading(doc, "6  需求边界与取舍", level=2)
    add_table(
        doc,
        "第一版范围",
        ["维度", "范围"],
        [
            ("用户", "单用户，仅本人使用"),
            ("设备", "Windows 桌面浏览器，1280 像素及以上窗口"),
            ("网络", "完全离线可用，不登录、不联网、不上传"),
            ("数据", "本机 IndexedDB 持久化，单个 JSON 文件备份与恢复"),
            ("模块", "九个模块，每个模块按自身业务建模"),
            ("交互", "普通操作自动保存，表单保存有明确反馈"),
            ("验收", "每条需求可通过实际操作或自动化测试验证"),
        ],
        [1.0, 5.4],
        ["left", "left"],
        font_size=8,
        keep_together=True,
    )
    add_table(
        doc,
        "第一版暂不实现的内容",
        ["暂不实现", "原因"],
        [
            ("登录、账号体系、云同步、多设备互通", "单机单用户场景不需要，且会增加隐私风险"),
            ("手机端适配和远程访问", "第一版只服务桌面浏览器"),
            ("部署到公网", "本地运行即可满足使用需求"),
            ("自动发布内容和抓取平台数据", "涉及第三方授权和网络依赖，超出第一版范围"),
            ("复杂报表、年度统计和深度分析", "先保证记录和执行闭环，再考虑分析"),
            ("系统通知和外部日历集成", "第一版通过应用内提醒和今日计划完成"),
            ("AI 自动总结或生成内容", "不引入外部模型和联网依赖"),
            ("多人协作、分享和权限管理", "产品定位是个人专属工具"),
            ("花哨主题和复杂动画", "视觉以安静、紧凑、易扫描为主"),
        ],
        [3.0, 3.4],
        ["left", "left"],
        keep_together=True,
    )

    heading(doc, "7  中期自查结论", level=2)
    body(
        doc,
        "从需求构思角度看，本项目已经具备进入中期检查的条件。需求来源是真实使用场景，模块边界清楚，"
        "每个模块有独立的业务对象和操作，模块之间通过今日计划形成可解释的联动关系。",
    )
    body(
        doc,
        "从可验证性看，本文档第二部分为每条功能需求分配了编号和优先级，并为每个需求域准备了验收方式和"
        "需求追踪关系。已完成的第一版实现有单元测试、组件测试和端到端测试作为证据，可以支撑中期自查。",
    )
    body(
        doc,
        "目前仍需补充的内容有三项：组员姓名、学号和分工；课程要求的技术路线确认，即是否必须采用 "
        "Java SpringBoot 加关系型数据库；以及用例图、类图、时序图和 E-R 图等正式建模材料。",
    )

def add_part_two(doc):
    heading(doc, "第二部分  需求规格说明书", level=1, page_break_before=True)

    heading(doc, "8  引言", level=2)
    heading(doc, "8.1  目的", level=3)
    body(
        doc,
        "本文档定义个人工作生活管理系统第一版的功能需求、非功能需求、数据需求、业务规则和验收标准，"
        "用于中期检查自查、后续开发、测试用例设计和最终验收对照。",
    )
    heading(doc, "8.2  范围", level=3)
    body(
        doc,
        "系统是一个单用户、本地离线、桌面浏览器优先的个人工作生活管理应用。第一版包含首页总览、今日计划、"
        "自媒体、开发工作、咨询工作、健身计划、饮食计划、游戏娱乐、数据与设置九个模块。"
        "系统不提供登录、云同步、手机端、多人协作、公网部署和第三方平台自动对接。",
    )
    heading(doc, "8.3  术语与缩写", level=3)
    add_table(
        doc,
        "术语与缩写",
        ["术语", "含义"],
        [
            ("CASE", "计算机辅助软件工程，本文指开发、建模、版本控制和测试工具"),
            ("SRS", "软件需求规格说明书"),
            ("IndexedDB", "浏览器提供的本地数据库，用于持久化本应用数据"),
            ("今日计划", "按日期管理日程和待办，并承接各模块加入今日事项的统一执行入口"),
            ("来源模块", "产生某条今日计划事项的业务模块，例如开发、咨询、健身"),
            ("加入今日", "把来源模块的一条记录关联到指定日期的今日计划"),
            ("回滚点", "导入备份前自动保存的当前数据快照"),
            ("快速记录", "在任意页面打开的统一记录入口，支持八种记录类型"),
            ("首页摘要", "首页下方展示各模块关键数据的聚合卡片"),
        ],
        [1.25, 5.15],
        ["left", "left"],
    )
    heading(doc, "8.4  参考资料", level=3)
    for item in (
        "PRD.md，个人工作生活专属 App 产品需求文档",
        "DEVELOPMENT_PLAN.md，个人工作生活专属 App 开发计划",
        "ACCEPTANCE.md，第一版验收记录",
        "README.md，使用与开发说明",
    ):
        bullet(doc, item)

    heading(doc, "9  总体描述", level=2)
    heading(doc, "9.1  产品愿景", level=3)
    body(
        doc,
        "把工作、生活和计划集中在一个本机浏览器应用中，让用户打开首页就能知道今天要做什么，"
        "随手产生的想法有地方记录，各模块的关键信息能够被看见，数据始终保存在自己的电脑上。",
    )
    heading(doc, "9.2  用户特征", level=3)
    body(
        doc,
        "单一用户，熟悉基本的桌面浏览器操作，不需要技术背景即可使用。日常同时处理开发、咨询、自媒体、"
        "健身、饮食和娱乐事务，愿意定期导出备份。用户对登录、联网和云同步没有需求，对数据隐私和离线可用有明确要求。",
    )
    heading(doc, "9.3  运行环境", level=3)
    add_table(
        doc,
        "运行环境要求",
        ["项目", "要求"],
        [
            ("操作系统", "Windows 10 或 Windows 11"),
            ("浏览器", "Microsoft Edge 或 Google Chrome 当前稳定版本"),
            ("窗口宽度", "1280 像素及以上"),
            ("运行方式", "本地静态服务器，固定地址 127.0.0.1:4173"),
            ("开发运行", "Node.js LTS，开发服务器固定地址 127.0.0.1:5173"),
            ("网络", "全部功能可离线使用，页面不发起外部网络请求"),
            ("数据存储", "浏览器 IndexedDB，通过固定来源访问"),
        ],
        [1.35, 5.05],
        ["left", "left"],
        font_size=8.5,
    )
    heading(doc, "9.4  设计约束", level=3)
    for item in (
        "单用户、单机、本地运行，不做账号体系和权限模型。",
        "不依赖云数据库、第三方接口和外部服务，断网后全部功能可用。",
        "访问地址和端口固定，端口变化视为新的数据来源。",
        "数据保存在当前电脑，刷新、关闭浏览器和重启电脑后必须仍然存在。",
        "首页只做聚合，不重复保存业务数据。",
        "每个模块按自身业务建模，不使用同一套任务列表覆盖全部场景。",
    ):
        bullet(doc, item)
    heading(doc, "9.5  假设与依赖", level=3)
    for item in (
        "用户只在本人电脑上使用本系统，不需要跨设备同步。",
        "用户不会主动清理浏览器站点数据；即使发生，也可通过导出的备份恢复。",
        "用户接受在桌面浏览器中运行，不需要安装独立桌面程序。",
        "系统依赖本机浏览器的 IndexedDB 能力，Edge 和 Chrome 当前稳定版本均满足要求。",
        "用户会定期导出备份，系统在设置页显示最近备份时间作为提醒。",
    ):
        bullet(doc, item)

    heading(doc, "10  功能需求", level=2)
    body(
        doc,
        "功能需求按模块编号。优先级分为必须、应该、可选三档：必须表示第一版不可缺少，"
        "应该表示明显提升使用价值且第一版已纳入，可选表示在资源允许时补充。每条需求均可通过实际操作验证。",
    )

    heading(doc, "10.1  全局与首页", level=3)
    add_table(
        doc,
        "全局与首页功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-G-01", "九模块导航", "左侧导航提供九个模块入口，当前页面高亮，点击后进入对应页面。", "必须"),
            ("FR-G-02", "全局搜索", "可搜索备忘、计划、自媒体内容、开发项目与待办、客户与跟进、训练计划与记录、饮食项、游戏与娱乐清单，点击结果跳转对应模块。", "应该"),
            ("FR-G-03", "全局快速记录", "任意页面可打开快速记录，支持备忘、今日任务、自媒体选题、开发待办、咨询跟进、训练计划、饮食记录、游戏八种类型。", "必须"),
            ("FR-G-04", "单条删除撤销", "删除单条计划后显示撤销提示，撤销后恢复原记录及字段。", "应该"),
            ("FR-G-05", "未保存修改提醒", "计划编辑表单存在未保存修改时，取消或离开前弹出确认。", "应该"),
            ("FR-H-01", "今日概览", "首页显示当前日期、今日待办数、已完成数和完成进度。", "必须"),
            ("FR-H-02", "今日计划聚合", "首页按顺序展示今日计划事项，显示完成状态、来源模块以及时间或优先级。", "必须"),
            ("FR-H-03", "快速备忘", "首页可新增备忘，并查看最近未归类的备忘。", "必须"),
            ("FR-H-04", "模块摘要", "首页展示自媒体、开发、咨询、健身、饮食、游戏六个模块的关键摘要，点击进入对应模块。", "必须"),
            ("FR-H-05", "备忘归类", "备忘可转为今日任务、自媒体选题、开发待办、咨询跟进等记录，转换后标记为已归类。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.2  今日计划", level=3)
    add_table(
        doc,
        "今日计划功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-P-01", "日期切换", "支持前一天、后一天和日期选择，并可直接回到今天。", "必须"),
            ("FR-P-02", "计划增删改", "支持新建、编辑、删除固定日程和待办，保存后立即生效。", "必须"),
            ("FR-P-03", "计划属性", "支持固定日程与待办两种类型，支持高、中、低优先级和可选开始时间。", "必须"),
            ("FR-P-04", "拖拽排序", "未完成事项可拖拽调整顺序，刷新后顺序保持。", "必须"),
            ("FR-P-05", "完成与取消", "勾选后进入已完成区，可取消完成恢复为未完成。", "必须"),
            ("FR-P-06", "未完成处理", "历史日期未完成事项可选择顺延到次日、保留或放弃。", "必须"),
            ("FR-P-07", "加入今日", "各模块事项可加入今日计划，同一来源同一天不重复创建。", "必须"),
            ("FR-P-08", "完成状态同步", "今日计划与来源模块的完成状态双向同步，删除来源记录时清理今日引用。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.3  自媒体", level=3)
    add_table(
        doc,
        "自媒体功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-M-01", "账号与栏目", "支持新增、编辑、删除账号或栏目，并按账号筛选内容。", "必须"),
            ("FR-M-02", "四状态看板", "内容分为灵感、创作中、待发布、已发布四列，显示数量和卡片。", "必须"),
            ("FR-M-03", "看板拖拽", "内容卡片可拖到其他状态列，状态和顺序持久化。", "必须"),
            ("FR-M-04", "内容详情", "支持标题、选题说明、文稿要点、账号、平台、计划发布时间和备注。", "必须"),
            ("FR-M-05", "发布数据", "已发布内容可手动记录播放、阅读、点赞、评论和涨粉数据。", "应该"),
            ("FR-M-06", "计划发布加入今日", "有计划发布日的内容可加入今日计划，完成今日事项后内容状态变为已发布。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.4  开发工作", level=3)
    add_table(
        doc,
        "开发工作功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-D-01", "项目管理", "支持新建、编辑、归档、恢复和删除项目，显示项目状态。", "必须"),
            ("FR-D-02", "项目待办", "项目内支持新增、编辑、完成、删除待办，记录优先级和截止日期。", "必须"),
            ("FR-D-03", "Bug 管理", "支持新增、编辑、完成、删除 Bug，记录严重程度和复现说明。", "必须"),
            ("FR-D-04", "开发日志", "按日期记录和编辑开发日志。", "必须"),
            ("FR-D-05", "里程碑", "支持新增、编辑、删除里程碑，记录目标日期和状态。", "应该"),
            ("FR-D-06", "待办加入今日", "项目待办可加入今日计划，完成状态与项目待办同步。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.5  咨询工作", level=3)
    add_table(
        doc,
        "咨询工作功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-C-01", "客户档案", "支持新增、编辑、搜索、删除客户，记录联系方式和下次跟进日期。", "必须"),
            ("FR-C-02", "咨询记录", "按日期记录咨询主题、要点和下一步，按时间线倒序展示。", "必须"),
            ("FR-C-03", "跟进待办", "可手动新增跟进，也可从咨询记录的下一步自动生成跟进待办。", "必须"),
            ("FR-C-04", "结算记录", "记录结算日期、次数或时长、金额、状态和备注。", "应该"),
            ("FR-C-05", "跟进加入今日", "跟进待办可加入今日计划，完成状态与跟进待办同步。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.6  健身计划", level=3)
    add_table(
        doc,
        "健身计划功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-F-01", "训练计划", "创建训练计划，记录适用星期、动作、组数、次数、目标重量和单位。", "必须"),
            ("FR-F-02", "本周安排", "按周展示七天训练安排，标记计划日、完成日和休息日。", "必须"),
            ("FR-F-03", "逐组打卡", "今日训练可逐组勾选，并填写实际次数和实际重量。", "必须"),
            ("FR-F-04", "训练历史", "完成训练后生成历史记录，按日期回看。", "必须"),
            ("FR-F-05", "身体数据", "记录体重、腰围等数据，并以简单趋势线展示体重变化。", "应该"),
            ("FR-F-06", "训练加入今日", "训练安排可加入今日计划，训练完成后今日事项同步完成。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.7  饮食计划", level=3)
    add_table(
        doc,
        "饮食计划功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-E-01", "每日餐次", "按日期管理早餐、午餐、晚餐、加餐四个区块，可新增、完成和删除食物项。", "必须"),
            ("FR-E-02", "常用食物", "维护常用食物或菜谱，可一键加入指定餐次。", "必须"),
            ("FR-E-03", "复制安排", "支持把昨天的全部饮食或某一餐复制到今天。", "应该"),
            ("FR-E-04", "饮水记录", "显示饮水目标和实际饮水量，支持每次加 250 毫升或直接设置总量。", "必须"),
            ("FR-E-05", "每日完成", "全部食物项完成后，当日饮食记录标记为已完成。", "必须"),
            ("FR-E-06", "饮食加入今日", "当日饮食记录可加入今日计划，完成状态双向同步。", "必须"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "10.8  游戏娱乐", level=3)
    add_table(
        doc,
        "游戏娱乐功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-A-01", "游戏库", "支持新增、编辑、删除游戏，记录名称、平台、状态、评分和短评。", "必须"),
            ("FR-A-02", "游戏状态", "支持想玩、在玩、已通关、弃坑四种状态并按状态筛选。", "必须"),
            ("FR-A-03", "游玩时长", "每次记录游玩分钟数，系统自动累计总时长。", "必须"),
            ("FR-A-04", "评分短评", "支持五星评分和文字短评，刷新后保留。", "应该"),
            ("FR-A-05", "娱乐清单", "维护电影、剧集、书和其他娱乐内容，记录状态和备注。", "应该"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
        keep_together=True,
    )

    heading(doc, "10.9  数据与设置", level=3)
    add_table(
        doc,
        "数据与设置功能需求",
        ["编号", "需求名称", "需求描述", "优先级"],
        [
            ("FR-S-01", "全量导出", "一键导出包含全部模块和设置的 JSON 备份文件。", "必须"),
            ("FR-S-02", "导入恢复", "导入前校验备份格式并显示预览，确认后整体恢复。", "必须"),
            ("FR-S-03", "回滚点", "导入前自动保存当前数据快照，最多保留三个，可从回滚点恢复。", "应该"),
            ("FR-S-04", "数据清理", "支持按模块清空和清空全部数据，均需二次确认。", "必须"),
            ("FR-S-05", "显示偏好", "支持调整首页摘要的显示、顺序、默认打开页和饮水目标。", "必须"),
            ("FR-S-06", "数据概览", "显示各模块记录数量和最近更新时间。", "应该"),
        ],
        [0.8, 1.35, 3.65, 0.7],
        ["center", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "11  非功能需求", level=2)
    body(
        doc,
        "非功能需求围绕本地持久化、隐私、离线可用、桌面布局和可维护性展开。第一版不追求高并发和分布式能力，"
        "但必须保证单机使用时的可靠性和可恢复性。",
    )
    add_table(
        doc,
        "非功能需求",
        ["编号", "类别", "要求", "验证方式"],
        [
            ("NFR-01", "性能", "1000 条今日计划数据下，页面在 3 秒内进入可用状态。", "性能脚本抽查"),
            ("NFR-02", "响应", "常规新增、勾选、切换在 300 毫秒内给出可见反馈。", "人工操作观察"),
            ("NFR-03", "持久化", "刷新、关闭标签页、关闭浏览器、重启电脑后数据不丢失。", "持久化端到端测试和重启复检"),
            ("NFR-04", "自动保存", "普通输入和勾选自动保存，保存失败必须提示。", "异常场景检查"),
            ("NFR-05", "离线", "断网后全部功能可用，页面不发起外部网络请求。", "外部请求监听测试"),
            ("NFR-06", "隐私", "无登录、无账号、无云同步，数据不上传。", "代码审查和网络检查"),
            ("NFR-07", "数据安全", "导入损坏文件时拒绝并保持原数据不变，清空需二次确认。", "备份单元测试和端到端测试"),
            ("NFR-08", "可用性", "1280 像素及以上宽度无横向滚动，文字和控件不重叠。", "三档分辨率页面走查"),
            ("NFR-09", "兼容性", "支持 Edge 和 Chrome 当前稳定版本。", "两种浏览器冒烟检查"),
            ("NFR-10", "可维护性", "TypeScript 严格模式，ESLint 通过，关键数据层有单元测试。", "类型检查、Lint、单元测试"),
            ("NFR-11", "可测试性", "每个模块有端到端测试，覆盖主流程和跨模块同步。", "Playwright 测试套件"),
            ("NFR-12", "数据规模", "支持 1000 条计划和 500 条开发日志仍可操作。", "性能脚本抽查"),
            ("NFR-13", "可恢复性", "备份文件可移动到其他目录后重新导入。", "备份导出导入测试"),
        ],
        [0.8, 0.9, 3.3, 1.5],
        ["center", "center", "left", "left"],
        font_size=8.5,
    )

    heading(doc, "12  数据需求", level=2)
    heading(doc, "12.1  数据实体", level=3)
    add_table(
        doc,
        "主要数据实体",
        ["数据域", "主要数据表", "关键字段", "说明"],
        [
            ("系统与计划", "settings、memos、planItems", "日期、标题、优先级、完成状态、来源类型、来源 ID、排序", "全局设置、快速备忘和今日计划"),
            ("自媒体", "mediaAccounts、mediaContents", "账号、标题、状态、计划发布时间、发布数据", "内容从灵感到发布"),
            ("开发", "devProjects、devTasks、devBugs、devLogs、devMilestones", "项目、状态、优先级、严重程度、日期、备注", "项目开发过程"),
            ("咨询", "clients、consultSessions、consultFollowUps、consultSettlements", "客户、日期、主题、要点、下一步、金额、结算状态", "客户与咨询闭环"),
            ("健身", "workoutPlans、workoutSessions、bodyMetrics", "动作、组数、次数、重量、训练记录、体重", "训练计划和身体数据"),
            ("饮食", "mealDays、mealItems、mealFavorites", "日期、餐次、食物、完成状态、饮水量", "每日饮食和常用食物"),
            ("游戏娱乐", "games、playLogs、entertainmentItems", "游戏、平台、状态、时长、评分、娱乐类型", "游戏库和娱乐清单"),
            ("备份", "backups", "备份类型、时间、数据快照", "导入前回滚点"),
        ],
        [0.9, 1.8, 2.3, 1.5],
        ["left", "left", "left", "left"],
        font_size=8.5,
        keep_together=True,
    )

    heading(doc, "12.2  数据关系", level=3)
    for item in (
        "今日计划事项通过来源类型和来源 ID 指向自媒体内容、开发待办、咨询跟进、训练记录或饮食记录。",
        "一个客户对应多条咨询记录、多条跟进待办和多条结算记录。",
        "一个开发项目对应多条待办、多条 Bug、多条开发日志和多条里程碑。",
        "一个训练计划对应多条训练记录，一条训练记录包含多个动作，每个动作包含多组实际数据。",
        "一个饮食日期对应多个食物项，一个游戏对应多条游玩记录。",
        "备份记录独立保存，不参与业务模块之间的引用关系。",
    ):
        bullet(doc, item)

    heading(doc, "12.3  数据持久化与生命周期", level=3)
    body(
        doc,
        "数据保存在固定来源的 IndexedDB 中。普通新增、编辑、勾选和拖拽操作完成后自动保存；表单类内容点击保存后生效。"
        "保存失败必须给出明确提示，不能显示成功。",
    )
    body(
        doc,
        "用户可以在数据与设置中导出单个 JSON 文件。导入前系统校验文件格式，显示备份时间和包含的数据表数量，"
        "确认后先把当前数据保存为回滚点，再整体替换。损坏文件、格式不符或非本应用备份会被拒绝，现有数据不受影响。",
    )
    body(
        doc,
        "按模块清空和清空全部数据都需要二次确认。清空全部数据后恢复默认设置，首页、今日计划和各模块同步显示空状态。",
    )

    heading(doc, "12.4  备份文件格式", level=3)
    add_table(
        doc,
        "备份文件字段",
        ["字段", "说明"],
        [
            ("app", "固定应用标识 personal-work-life-app，用于识别文件来源"),
            ("schemaVersion", "备份结构版本，第一版为 1"),
            ("exportedAt", "导出时间，ISO 格式"),
            ("tables", "按数据表保存的全部业务记录"),
            ("settings", "全局设置，包括首页摘要、默认页和饮水目标"),
        ],
        [1.35, 5.05],
        ["left", "left"],
        keep_together=True,
    )

    heading(doc, "13  外部接口需求", level=2)
    add_table(
        doc,
        "外部接口",
        ["接口", "类型", "说明"],
        [
            ("浏览器界面", "用户界面", "桌面浏览器中的单页应用，固定左侧导航和顶部工具条"),
            ("IndexedDB", "本地数据接口", "通过 Dexie 访问，保存全部业务数据和设置"),
            ("本地静态服务器", "运行接口", "监听 127.0.0.1:4173，提供构建后的页面和静态资源"),
            ("文件导入导出", "文件接口", "导出 JSON 备份，导入时读取并校验 JSON 文件"),
            ("外部网络接口", "无", "不调用第三方接口，不上传数据，不依赖在线服务"),
            ("登录接口", "无", "不需要账号、密码和身份认证"),
        ],
        [1.45, 1.15, 3.9],
        ["left", "left", "left"],
        keep_together=True,
    )

    heading(doc, "14  业务规则", level=2)
    add_table(
        doc,
        "业务规则",
        ["编号", "规则"],
        [
            ("BR-01", "日期统一使用本机时区的 YYYY-MM-DD 格式。"),
            ("BR-02", "今日计划事项来自模块时，来源类型和来源 ID 必填。"),
            ("BR-03", "同一来源同一天只能存在一条今日计划引用。"),
            ("BR-04", "今日计划勾选完成时，来源模块同步完成；取消完成时同步恢复。"),
            ("BR-05", "来源模块内部完成时，今日计划同步完成。"),
            ("BR-06", "删除来源记录时删除对应今日引用；删除今日引用不删除来源记录。"),
            ("BR-07", "备忘转换后状态为已归类，保留原创建时间和转换目标。"),
            ("BR-08", "导入备份前必须生成回滚点，回滚点最多三个，按时间淘汰。"),
            ("BR-09", "清空全部数据后恢复默认设置，并同步清空首页和今日计划。"),
            ("BR-10", "首页只读取数据，不单独保存业务记录。"),
            ("BR-11", "表单保存失败不得关闭表单或显示成功提示。"),
            ("BR-12", "固定访问地址和端口，端口变化视为不同数据来源。"),
        ],
        [0.8, 5.6],
        ["center", "left"],
        font_size=9,
    )

    heading(doc, "15  验收标准", level=2)
    body(
        doc,
        "验收标准按 PRD 第十章组织，既覆盖功能是否可用，也覆盖数据是否保留、备份是否可靠、布局是否可用。"
        "每条标准都可以通过一次实际操作或一段自动化测试判断。",
    )
    add_table(
        doc,
        "验收标准",
        ["验收域", "通过条件", "验证方式"],
        [
            ("运行与环境", "断网可用，无需登录，1280 像素宽度无横向滚动，不产生外部网络请求。", "导航测试、外部请求测试、页面走查"),
            ("数据持久化", "刷新、关闭浏览器、重启电脑后数据仍存在，模块引用仍有效。", "持久化端到端测试、重启复检"),
            ("备份与恢复", "可导出备份；清空后可导入恢复；损坏文件不破坏数据；清空需二次确认；单条删除可撤销。", "备份单元测试、设置页端到端测试"),
            ("导航与全局", "九个入口可用；快速记录支持八种类型；搜索跨模块；日期切换方式一致。", "导航测试、快速记录与搜索测试"),
            ("首页与今日", "首页勾选同步到来源模块；备忘可转换；模块事项可加入今日；未完成事项可处理。", "首页与计划端到端测试、同步单元测试"),
            ("模块流程", "自媒体、开发、咨询、健身、饮食、游戏六个模块均可完成主流程。", "六个模块端到端测试"),
            ("交互底线", "空状态清楚；保存反馈明确；批量操作和清空有确认；未保存修改有提醒；无内容溢出。", "组件测试、页面走查、人工验收"),
        ],
        [1.0, 3.4, 2.0],
        ["left", "left", "left"],
        font_size=8.5,
        keep_together=True,
    )
    body(
        doc,
        "中期自查判定：第一版功能需求已全部实现。自动化测试结果为 16 条单元和组件测试、17 条端到端测试通过，"
        "生产构建通过。除第 17 章列出的待确认事项外，本文档可以作为后续开发和最终验收的基线。",
    )

    heading(doc, "16  需求追踪", level=2)
    body(
        doc,
        "需求追踪用于确认每条需求都有实现位置和验证证据，避免需求文档与实现脱节。下表按需求域汇总。",
    )
    add_table(
        doc,
        "需求追踪矩阵",
        ["需求范围", "主要实现位置", "验证证据", "状态"],
        [
            ("FR-G、FR-H", "AppShell、HomePage、QuickCaptureModal、GlobalSearchDrawer", "shell-navigation、search-quickcapture、persistence 端到端测试", "已验证"),
            ("FR-P", "PlanPage、planLink、plan 仓储", "home-plan 端到端测试、planLink 单元测试", "已验证"),
            ("FR-M", "MediaPage、media 仓储", "media 端到端测试", "已验证"),
            ("FR-D", "DevPage、dev 仓储", "dev 端到端测试", "已验证"),
            ("FR-C", "ConsultPage、consult 仓储", "consult 端到端测试", "已验证"),
            ("FR-F", "FitnessPage、fitness 仓储", "fitness 端到端测试", "已验证"),
            ("FR-E", "DietPage、diet 仓储", "diet 端到端测试", "已验证"),
            ("FR-A", "GamesPage、games 仓储", "games 端到端测试", "已验证"),
            ("FR-S", "SettingsPage、backup.ts", "settings-backup 端到端测试、backup 单元测试", "已验证"),
            ("NFR-01 至 NFR-13", "全项目", "类型检查、Lint、单元测试、端到端测试、视觉和性能抽查", "已验证"),
        ],
        [1.0, 2.1, 2.75, 0.65],
        ["left", "left", "left", "center"],
        font_size=8.5,
    )

    heading(doc, "17  风险与待确认事项", level=2)
    add_table(
        doc,
        "风险与待确认事项",
        ["编号", "事项", "影响", "处理建议"],
        [
            ("R-01", "课程可能要求 Java SpringBoot 加关系型数据库", "高", "开题前与教师确认；若必须后端，保留前端方案并增加 SpringBoot 和 MySQL 适配"),
            ("R-02", "组员姓名、学号和分工尚未填写", "中", "提交前补充完整，并按模块划分分工"),
            ("R-03", "浏览器清理站点数据导致本地数据丢失", "中", "定期导出备份；设置页显示最近备份时间"),
            ("R-04", "固定端口被占用", "低", "启动脚本检测端口；文档写明固定地址"),
            ("R-05", "中期材料缺少正式 UML 图", "中", "补充用例图、类图、时序图和 E-R 图"),
            ("R-06", "大数据量下页面性能下降", "低", "已完成 1000 条计划抽查；后续按需增加虚拟滚动"),
            ("R-07", "不同浏览器对 IndexedDB 的支持差异", "低", "固定使用 Edge 和 Chrome 当前稳定版本"),
        ],
        [0.6, 2.0, 0.7, 3.2],
        ["center", "left", "center", "left"],
        font_size=8.5,
        keep_together=True,
    )

def add_appendix(doc):
    heading(doc, "附录  中期检查自查清单", level=1, page_break_before=True)
    body(
        doc,
        "本清单用于提交前逐项检查。已完成的条目可以直接作为中期材料的一部分，待补充的条目需要在提交前补齐。",
    )
    add_table(
        doc,
        "中期检查自查清单",
        ["检查项", "自查结果", "说明"],
        [
            ("选题和功能范围是否明确", "通过", "九个模块和第一版边界已写明"),
            ("模块划分是否有差异", "通过", "每个模块有独立业务对象和操作"),
            ("模块之间关系是否清楚", "通过", "通过今日计划和首页摘要形成联动"),
            ("功能需求是否编号并分级", "通过", "58 条功能需求，标注必须、应该"),
            ("非功能需求是否可验证", "通过", "性能、持久化、隐私、布局和可维护性均有验证方式"),
            ("数据需求和备份要求是否完整", "通过", "数据实体、关系、持久化和备份格式已说明"),
            ("验收标准是否可执行", "通过", "按七个验收域给出通过条件和验证方式"),
            ("需求追踪是否建立", "通过", "需求域、实现位置、测试证据和状态已对应"),
            ("组员信息和分工是否完整", "待补充", "姓名、学号、分工需按实际情况填写"),
            ("是否具备正式 UML 建模图", "待补充", "建议补充用例图、类图、时序图和 E-R 图"),
            ("课程技术路线是否确认", "待确认", "需确认是否必须使用 Java SpringBoot 加关系型数据库"),
        ],
        [2.2, 0.9, 3.3],
        ["left", "center", "left"],
        font_size=9,
    )
    body(
        doc,
        "自查结论：需求构思和需求规格说明已经能够支撑中期检查。提交前优先补齐组员信息、技术路线确认和建模图，"
        "这三项不影响系统本身的可运行性，但会影响课程材料的完整性。",
    )


def main():
    doc = setup_document()
    add_cover(doc)
    add_toc_page(doc)
    add_part_one(doc)
    add_part_two(doc)
    add_appendix(doc)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
