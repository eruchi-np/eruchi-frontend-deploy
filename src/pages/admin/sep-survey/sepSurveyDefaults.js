import { Type, FileText, CheckSquare, ListOrdered, Sliders, Users, Target, Table2, ShieldAlert } from 'lucide-react';

export const SATISFACTION_SCALE = [
  'Completely satisfied',
  'Very satisfied',
  'Moderately satisfied',
  'Slightly satisfied',
  'Not at all satisfied',
  'Not applicable',
];

export const DEFAULT_MATRIX_ROWS = ['Sales process', 'Onboarding', 'Product support'];

export const EMPTY_QUESTION = {
  questionText: '',
  questionType: 'text_short',
  options: [],
  rows: [],
  maxSelections: 1,
  minValue: 0,
  maxValue: 5,
  isRequired: true,
  metricTag: 'none',
  attentionCheck: false,
  attentionAnswer: ''
};

export const createEmptyFormData = () => ({
  title: '',
  description: '',
  status: 'published',
  credits: 50,
  kind: 'normal',
  publishedAt: new Date().toISOString().slice(0, 16),
  availableDays: 7,
  estimatedMinutes: '',
  visibility: 'public',
  validityDays: 7,
  alsoPublishToOthers: false,
  clusterSendAt: new Date().toISOString().slice(0, 16),
  clusterIds: [],
  questions: [{ ...EMPTY_QUESTION }]
});

export const questionTypes = [
  { value: 'text_short', label: 'Short Text', icon: Type, description: 'Brief text response' },
  { value: 'text_long', label: 'Long Text', icon: FileText, description: 'Detailed paragraph' },
  { value: 'single_checkbox', label: 'Single Choice', icon: CheckSquare, description: 'Pick one option' },
  { value: 'attention_check', label: 'Attention Check', icon: ShieldAlert, description: 'Pick one, with a correct answer' },
  { value: 'likert', label: 'Likert Scale', icon: ListOrdered, description: 'Pick one on a scale' },
  { value: 'multiple_checkbox', label: 'Multiple Choice', icon: CheckSquare, description: 'Pick multiple' },
  { value: 'slider', label: 'Slider', icon: Sliders, description: 'Range selection' },
  { value: 'matrix_radio', label: 'Matrix', icon: Table2, description: 'One choice per row' }
];

export const metricTagOptions = [
  { value: 'none', label: 'None', description: 'Normal question' },
  { value: 'cep', label: 'CEP', description: 'Category entry point' },
  { value: 'nps', label: 'NPS', description: 'Net promoter score' }
];

export const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'archived', label: 'Archived', color: 'bg-orange-100 text-orange-700 border-orange-200' }
];

export const visibilityOptions = [
  {
    value: 'public',
    label: 'Public',
    icon: Users,
    description: 'Shows up for every eligible user in the general survey list'
  },
  {
    value: 'targeted',
    label: 'Targeted',
    icon: Target,
    description: 'Sent to selected clusters (and/or merchant feedback). Hidden from others unless you enable dual publish.'
  }
];

export const kindOptions = [
  {
    value: 'normal',
    label: 'Normal survey',
    description: 'Full survey — awards credits and counts toward streak'
  },
  {
    value: 'daily',
    label: 'Daily survey',
    description: 'Shorter bonus survey — awards credits only, no streak'
  }
];
