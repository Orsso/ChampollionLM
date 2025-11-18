"""Tests for PDF export functionality."""
import pytest
from app.exporters.pdf import normalize_markdown


class TestMarkdownNormalization:
    """Test Markdown normalization for PDF conversion."""
    
    def test_add_blank_line_after_headings(self):
        """Test that blank lines are added after headings."""
        markdown = "# Title\nParagraph text"
        result = normalize_markdown(markdown)
        assert result == "# Title\n\nParagraph text\n"
    
    def test_add_blank_line_before_lists(self):
        """Test that blank lines are added before lists."""
        markdown = "Some text\n1. First item\n2. Second item"
        result = normalize_markdown(markdown)
        assert "Some text\n\n1. First item" in result
    
    def test_add_blank_line_before_bullet_lists(self):
        """Test that blank lines are added before bullet lists."""
        markdown = "Some text\n- First item\n- Second item"
        result = normalize_markdown(markdown)
        assert "Some text\n\n- First item" in result
    
    def test_add_blank_line_before_code_blocks(self):
        """Test that blank lines are added before code blocks."""
        markdown = "Some text\n```python\ncode\n```"
        result = normalize_markdown(markdown)
        assert "Some text\n\n```python" in result
    
    def test_preserve_existing_blank_lines(self):
        """Test that existing blank lines are preserved."""
        markdown = "# Title\n\nParagraph\n\n1. Item"
        result = normalize_markdown(markdown)
        # Should not add extra blank lines
        assert "\n\n\n" not in result
    
    def test_reduce_multiple_blank_lines(self):
        """Test that multiple blank lines are reduced to two."""
        markdown = "# Title\n\n\n\nParagraph"
        result = normalize_markdown(markdown)
        assert "# Title\n\nParagraph" in result
    
    def test_complex_document(self):
        """Test normalization of a complex document."""
        markdown = """# Main Title
Introduction text.
## Section 1
Some content:
1. First point
2. Second point
3. Third point
After the list.
## Section 2
Bullet points:
- Point A
- Point B
Code example:
```python
def hello():
    pass
```
End."""
        result = normalize_markdown(markdown)
        
        # Check that all necessary blank lines are added
        assert "# Main Title\n\nIntroduction" in result
        assert "## Section 1\n\nSome content" in result
        assert "content:\n\n1. First" in result
        assert "list.\n## Section 2" in result or "list.\n\n## Section 2" in result
        assert "points:\n\n-" in result
        assert "example:\n\n```python" in result
    
    def test_strip_trailing_whitespace(self):
        """Test that trailing whitespace is removed."""
        markdown = "# Title   \nText   \n"
        result = normalize_markdown(markdown)
        assert "Title   " not in result
        assert "Text   " not in result
    
    def test_unicode_characters(self):
        """Test that Unicode characters are preserved."""
        markdown = "# Test ≠ Title\n→ Arrow\n1. First ∈ Set"
        result = normalize_markdown(markdown)
        assert "≠" in result
        assert "→" in result
        assert "∈" in result
    
    def test_nested_lists(self):
        """Test handling of nested lists."""
        markdown = """Text before
1. First item
   - Nested item
   - Another nested
2. Second item"""
        result = normalize_markdown(markdown)
        # Should add blank line before the list
        assert "Text before\n\n1. First item" in result
