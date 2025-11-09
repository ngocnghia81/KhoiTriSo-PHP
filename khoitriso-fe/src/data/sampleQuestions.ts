export interface SampleQuestion {
  content: string;
  type: 'multiple_choice' | 'essay';
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
  correctAnswer?: string;
}

export const sampleQuestions: SampleQuestion[] = [
  // Toán học - Trắc nghiệm
  {
    content: 'Giải phương trình: $$x^2 - 5x + 6 = 0$$',
    type: 'multiple_choice',
    options: [
      { text: '$$x = 2$$ hoặc $$x = 3$$', isCorrect: true },
      { text: '$$x = 1$$ hoặc $$x = 6$$', isCorrect: false },
      { text: '$$x = -2$$ hoặc $$x = -3$$', isCorrect: false },
      { text: '$$x = 0$$ hoặc $$x = 5$$', isCorrect: false },
    ],
    explanation: 'Phân tích thành nhân tử: $$(x-2)(x-3) = 0$$, suy ra $$x = 2$$ hoặc $$x = 3$$.',
  },
  {
    content: 'Tính đạo hàm của hàm số $$f(x) = x^3 + 2x^2 - 5x + 1$$',
    type: 'multiple_choice',
    options: [
      { text: '$$f\'(x) = 3x^2 + 4x - 5$$', isCorrect: true },
      { text: '$$f\'(x) = 3x^2 + 2x - 5$$', isCorrect: false },
      { text: '$$f\'(x) = x^2 + 4x - 5$$', isCorrect: false },
      { text: '$$f\'(x) = 3x^2 + 4x$$', isCorrect: false },
    ],
    explanation: 'Áp dụng công thức đạo hàm: $$(x^n)\' = nx^{n-1}$$. Ta có: $$f\'(x) = 3x^2 + 4x - 5$$.',
  },
  {
    content: 'Tính tích phân: $$\\int_0^1 x^2 dx$$',
    type: 'multiple_choice',
    options: [
      { text: '$$\\frac{1}{3}$$', isCorrect: true },
      { text: '$$\\frac{1}{2}$$', isCorrect: false },
      { text: '$$1$$', isCorrect: false },
      { text: '$$\\frac{2}{3}$$', isCorrect: false },
    ],
    explanation: '$$\\int_0^1 x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3} - 0 = \\frac{1}{3}$$.',
  },
  {
    content: 'Tính giới hạn: $$\\lim_{x \\to 0} \\frac{\\sin x}{x}$$',
    type: 'multiple_choice',
    options: [
      { text: '$$1$$', isCorrect: true },
      { text: '$$0$$', isCorrect: false },
      { text: '$$\\infty$$', isCorrect: false },
      { text: 'Không tồn tại', isCorrect: false },
    ],
    explanation: 'Đây là giới hạn cơ bản: $$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$ (sử dụng quy tắc L\'Hôpital hoặc khai triển Taylor).',
  },
  {
    content: 'Tính căn bậc hai của $$16$$',
    type: 'multiple_choice',
    options: [
      { text: '$$4$$', isCorrect: true },
      { text: '$$8$$', isCorrect: false },
      { text: '$$-4$$', isCorrect: false },
      { text: '$$\\pm 4$$', isCorrect: false },
    ],
    explanation: '$$\\sqrt{16} = 4$$ vì $$4^2 = 16$$.',
  },
  
  // Vật lý - Trắc nghiệm
  {
    content: 'Một vật chuyển động với vận tốc $$v = 10 m/s$$. Tính quãng đường vật đi được sau $$5$$ giây?',
    type: 'multiple_choice',
    options: [
      { text: '$$50 m$$', isCorrect: true },
      { text: '$$15 m$$', isCorrect: false },
      { text: '$$2 m$$', isCorrect: false },
      { text: '$$100 m$$', isCorrect: false },
    ],
    explanation: 'Quãng đường: $$s = v \\times t = 10 \\times 5 = 50 m$$.',
  },
  {
    content: 'Công thức tính động năng là:',
    type: 'multiple_choice',
    options: [
      { text: '$$E_d = \\frac{1}{2}mv^2$$', isCorrect: true },
      { text: '$$E_d = mv^2$$', isCorrect: false },
      { text: '$$E_d = \\frac{1}{2}mv$$', isCorrect: false },
      { text: '$$E_d = mgh$$', isCorrect: false },
    ],
    explanation: 'Động năng được tính bằng công thức: $$E_d = \\frac{1}{2}mv^2$$, trong đó $$m$$ là khối lượng và $$v$$ là vận tốc.',
  },
  
  // Hóa học - Trắc nghiệm
  {
    content: 'Công thức hóa học của nước là:',
    type: 'multiple_choice',
    options: [
      { text: '$$H_2O$$', isCorrect: true },
      { text: '$$H_2O_2$$', isCorrect: false },
      { text: '$$HO$$', isCorrect: false },
      { text: '$$H_3O$$', isCorrect: false },
    ],
    explanation: 'Nước có công thức hóa học là $$H_2O$$, gồm 2 nguyên tử hydro và 1 nguyên tử oxy.',
  },
  
  // Toán học - Tự luận
  {
    content: 'Giải phương trình bậc hai: $$x^2 - 4x + 3 = 0$$',
    type: 'essay',
    correctAnswer: 'Sử dụng công thức nghiệm: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nVới $$a = 1$$, $$b = -4$$, $$c = 3$$:\n\n$$x = \\frac{4 \\pm \\sqrt{16 - 12}}{2} = \\frac{4 \\pm 2}{2}$$\n\nVậy $$x_1 = 3$$ hoặc $$x_2 = 1$$.',
    explanation: 'Phương trình có hai nghiệm phân biệt vì $$\\Delta = b^2 - 4ac = 16 - 12 = 4 > 0$$.',
  },
  {
    content: 'Tính đạo hàm của hàm số $$f(x) = \\sin(x) \\cos(x)$$',
    type: 'essay',
    correctAnswer: 'Sử dụng quy tắc tích: $$(uv)\' = u\'v + uv\'$$\n\n$$f\'(x) = \\cos(x) \\cdot \\cos(x) + \\sin(x) \\cdot (-\\sin(x))$$\n\n$$f\'(x) = \\cos^2(x) - \\sin^2(x) = \\cos(2x)$$',
    explanation: 'Có thể sử dụng công thức: $$\\sin(2x) = 2\\sin(x)\\cos(x)$$, suy ra $$f(x) = \\frac{1}{2}\\sin(2x)$$, do đó $$f\'(x) = \\cos(2x)$$.',
  },
  {
    content: 'Tính tích phân: $$\\int_0^{\\pi} \\sin(x) dx$$',
    type: 'essay',
    correctAnswer: '$$\\int_0^{\\pi} \\sin(x) dx = [-\\cos(x)]_0^{\\pi} = -\\cos(\\pi) - (-\\cos(0)) = -(-1) - (-1) = 1 + 1 = 2$$',
    explanation: 'Nguyên hàm của $$\\sin(x)$$ là $$-\\cos(x)$$. Áp dụng công thức Newton-Leibniz.',
  },
  {
    content: 'Chứng minh rằng: $$\\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1$$',
    type: 'essay',
    correctAnswer: 'Sử dụng quy tắc L\'Hôpital:\n\n$$\\lim_{x \\to 0} \\frac{e^x - 1}{x} = \\lim_{x \\to 0} \\frac{(e^x - 1)\'}{(x)\'} = \\lim_{x \\to 0} \\frac{e^x}{1} = e^0 = 1$$',
    explanation: 'Có thể chứng minh bằng khai triển Taylor: $$e^x = 1 + x + \\frac{x^2}{2!} + ...$$, suy ra $$\\frac{e^x - 1}{x} = 1 + \\frac{x}{2!} + ... \\to 1$$ khi $$x \\to 0$$.',
  },
  
  // Vật lý - Tự luận
  {
    content: 'Một vật có khối lượng $$m = 2 kg$$ rơi tự do từ độ cao $$h = 20 m$$. Tính vận tốc của vật khi chạm đất (bỏ qua lực cản không khí, $$g = 10 m/s^2$$).',
    type: 'essay',
    correctAnswer: 'Sử dụng định luật bảo toàn năng lượng:\n\nThế năng ban đầu: $$E_t = mgh = 2 \\times 10 \\times 20 = 400 J$$\n\nKhi chạm đất, thế năng chuyển hóa hoàn toàn thành động năng:\n\n$$\\frac{1}{2}mv^2 = mgh$$\n\n$$v^2 = 2gh = 2 \\times 10 \\times 20 = 400$$\n\n$$v = \\sqrt{400} = 20 m/s$$',
    explanation: 'Có thể sử dụng công thức: $$v = \\sqrt{2gh} = \\sqrt{2 \\times 10 \\times 20} = 20 m/s$$.',
  },
  
  // Hóa học - Tự luận
  {
    content: 'Viết phương trình phản ứng đốt cháy hoàn toàn khí metan ($$CH_4$$) trong không khí.',
    type: 'essay',
    correctAnswer: 'Phương trình phản ứng:\n\n$$CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O$$\n\nMetan phản ứng với oxy tạo ra khí cacbonic và nước.',
    explanation: 'Đây là phản ứng đốt cháy hydrocarbon, sản phẩm là $$CO_2$$ và $$H_2O$$.',
  },
  
  // Toán học - Trắc nghiệm (nâng cao)
  {
    content: 'Tính giá trị của biểu thức: $$\\sum_{i=1}^{5} i^2$$',
    type: 'multiple_choice',
    options: [
      { text: '$$55$$', isCorrect: true },
      { text: '$$30$$', isCorrect: false },
      { text: '$$25$$', isCorrect: false },
      { text: '$$15$$', isCorrect: false },
    ],
    explanation: '$$\\sum_{i=1}^{5} i^2 = 1^2 + 2^2 + 3^2 + 4^2 + 5^2 = 1 + 4 + 9 + 16 + 25 = 55$$.',
  },
  {
    content: 'Tính định thức của ma trận: $$\\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix}$$',
    type: 'multiple_choice',
    options: [
      { text: '$$5$$', isCorrect: true },
      { text: '$$11$$', isCorrect: false },
      { text: '$$-5$$', isCorrect: false },
      { text: '$$8$$', isCorrect: false },
    ],
    explanation: 'Định thức: $$\\det = 2 \\times 4 - 3 \\times 1 = 8 - 3 = 5$$.',
  },
  
  // Toán học - Tự luận (nâng cao)
  {
    content: 'Tính tích phân: $$\\int_0^{\\frac{\\pi}{2}} \\sin^2(x) dx$$',
    type: 'essay',
    correctAnswer: 'Sử dụng công thức: $$\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}$$\n\n$$\\int_0^{\\frac{\\pi}{2}} \\sin^2(x) dx = \\int_0^{\\frac{\\pi}{2}} \\frac{1 - \\cos(2x)}{2} dx$$\n\n$$= \\frac{1}{2} \\int_0^{\\frac{\\pi}{2}} (1 - \\cos(2x)) dx$$\n\n$$= \\frac{1}{2} \\left[ x - \\frac{\\sin(2x)}{2} \\right]_0^{\\frac{\\pi}{2}}$$\n\n$$= \\frac{1}{2} \\left( \\frac{\\pi}{2} - 0 \\right) = \\frac{\\pi}{4}$$',
    explanation: 'Có thể sử dụng công thức hạ bậc: $$\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}$$.',
  },
];

