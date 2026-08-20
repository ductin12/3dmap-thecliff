import React, { useState } from 'react';
import { X, Copy, Check, Code, Globe, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';


export const WordPressEmbedContent: React.FC = () => {
  const [embedWidth, setEmbedWidth] = useState('100%');
  const [embedHeight, setEmbedHeight] = useState('800px');
  const [hideHeaderInEmbed, setHideHeaderInEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phpCopied, setPhpCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'elementor' | 'gutenberg' | 'shortcode'>('elementor');

  const currentAppUrl = window.location.origin;
  const embedUrl = `${currentAppUrl}${hideHeaderInEmbed ? '?embed=true' : ''}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="${embedWidth}"
  height="${embedHeight}"
  style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden;"
  allow="fullscreen; autoplay; geolocation"
  loading="lazy"
  title="The Cliff Resort 3D Interactive Map">
</iframe>`;

  const phpShortcodeSnippet = `// Dán đoạn mã này vào file functions.php của Theme WordPress của bạn:
function add_cliff_3d_map_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '800px',
    ), $atts);

    return '<iframe src="${embedUrl}" width="100%" height="' . esc_attr($atts['height']) . '" style="border:none; border-radius:16px; width:100%; shadow: 0 10px 30px rgba(0,0,0,0.2);" allow="fullscreen"></iframe>';
}
add_shortcode('cliff_3d_map', 'add_cliff_3d_map_shortcode');

// Sau đó trong bài viết / trang WordPress chỉ cần gõ shortcode: [cliff_3d_map]`;

  const handleCopyIframe = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPHP = () => {
    navigator.clipboard.writeText(phpShortcodeSnippet);
    setPhpCopied(true);
    setTimeout(() => setPhpCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          
      {/* Customization Options */}
      <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100 space-y-3">
        <h3 className="font-serif font-bold text-sm text-[#1A365D] flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[#C5A059]" />
          <span>Tùy Chỉnh Kích Thước Mã Nhúng</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-gray-600 font-bold mb-1">Chiều Rộng (Width)</label>
            <input
              type="text"
              value={embedWidth}
              onChange={(e) => setEmbedWidth(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">Chiều Cao (Height)</label>
            <input
              type="text"
              value={embedHeight}
              onChange={(e) => setEmbedHeight(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-bold">
              <input
                type="checkbox"
                checked={hideHeaderInEmbed}
                onChange={(e) => setHideHeaderInEmbed(e.target.checked)}
                className="w-4 h-4 accent-[#1A365D] rounded"
              />
              <span>Ẩn thanh Navbar ngoài cùng</span>
            </label>
          </div>
        </div>
      </div>

      {/* Generated Snippet Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#1A365D]">
            Mã HTML iFrame Nhúng Trực Tiếp
          </h3>
          <button
            onClick={handleCopyIframe}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép mã iFrame'}</span>
          </button>
        </div>

        <pre className="p-4 bg-[#FDFCFB] rounded-2xl border border-gray-200 text-[#2D3748] font-mono text-[11px] overflow-x-auto whitespace-pre-wrap select-all shadow-xs">
          {iframeSnippet}
        </pre>
      </div>

      {/* Step-by-Step Instructions Tabs */}
      <div className="space-y-3 pt-2">
        <h3 className="font-serif font-bold text-sm text-[#1A365D] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#C5A059]" />
          <span>Hướng Dẫn Chèn Vào Trình Dựng Trang WordPress</span>
        </h3>

        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveGuideTab('elementor')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${
              activeGuideTab === 'elementor' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-[#F7FAFC] text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            1. Elementor Builder
          </button>
          <button
            onClick={() => setActiveGuideTab('gutenberg')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${
              activeGuideTab === 'gutenberg' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-[#F7FAFC] text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            2. Trình Soạn Thảo Gutenberg
          </button>
          <button
            onClick={() => setActiveGuideTab('shortcode')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${
              activeGuideTab === 'shortcode' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-[#F7FAFC] text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            3. Tạo Shortcode WordPress [cliff_3d_map]
          </button>
        </div>

        {/* Guide Details */}
        {activeGuideTab === 'elementor' && (
          <div className="p-4 bg-[#FDFCFB] rounded-2xl border border-gray-100 space-y-2 leading-relaxed text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 1:</strong> Mở trang muốn chèn bản đồ bằng Elementor.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 2:</strong> Ở thanh công cụ bên trái, tìm kiếm widget <strong>HTML</strong>.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 3:</strong> Kéo thả widget HTML vào vị trí muốn hiển thị bản đồ trên trang.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 4:</strong> Dán mã iFrame đã sao chép ở trên vào ô <strong>HTML Code</strong> và nhấn <strong>Cập nhật (Update)</strong>.</p>
            </div>
          </div>
        )}

        {activeGuideTab === 'gutenberg' && (
          <div className="p-4 bg-[#FDFCFB] rounded-2xl border border-gray-100 space-y-2 leading-relaxed text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 1:</strong> Mở bài viết hoặc trang trong trình chỉnh sửa Gutenberg chuẩn của WordPress.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 2:</strong> Bấm nút dấu <strong>+</strong> để thêm Block mới, gõ tìm <strong>HTML Tùy Chỉnh (Custom HTML)</strong>.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p><strong>Bước 3:</strong> Dán mã iFrame vào ô và bấm <strong>Xem trước (Preview)</strong> để kiểm tra bản đồ 3D.</p>
            </div>
          </div>
        )}

        {activeGuideTab === 'shortcode' && (
          <div className="p-4 bg-[#FDFCFB] rounded-2xl border border-gray-100 space-y-3">
            <p className="text-gray-700 font-medium">
              Nếu bạn muốn dùng Shortcode <code>[cliff_3d_map]</code> ngắn gọn trong nội dung WordPress:
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleCopyPHP}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold text-[11px] shadow-sm"
              >
                {phpCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Sao chép mã PHP</span>
              </button>
            </div>
            <pre className="p-3 bg-[#F7FAFC] rounded-xl border border-gray-200 font-mono text-[10px] text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {phpShortcodeSnippet}
            </pre>
          </div>
        )}

      </div>

    </div>
  );
};

