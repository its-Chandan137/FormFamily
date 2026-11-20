import { START_ANCHOR } from '@/lib/constants';
import type {
  FormContent,
  FormRecord,
  FormVersion,
  LayoutElement,
  OwnField,
  ResolvedField,
  ResolvedForm,
  ResolvedItem,
} from '@/types';

const iso = (d: string) => new Date(d).toISOString();

function el(
  id: string,
  type: LayoutElement['type'],
  props: Record<string, unknown>,
  insertAfter: string | null,
): LayoutElement {
  return { id, type, props, insertAfter };
}

function field(
  key: string,
  label: string,
  type: OwnField['type'],
  insertAfter: string | null,
  opts: Partial<Omit<OwnField, 'key' | 'label' | 'type' | 'insertAfter'>> = {},
): OwnField {
  return {
    key,
    label,
    type,
    insertAfter,
    required: opts.required ?? false,
    hidden: opts.hidden ?? false,
    placeholder: opts.placeholder,
    helpText: opts.helpText,
    options: opts.options,
    validation: undefined,
  };
}

function rField(
  f: Omit<ResolvedField, 'locked'> & { locked?: boolean },
): ResolvedField {
  return { locked: false, ...f };
}

function rFieldItem(fieldDef: ResolvedField): ResolvedItem {
  return { kind: 'field', field: fieldDef };
}

function rElItem(
  element: LayoutElement,
  origin: 'inherited' | 'own',
  sourceFormId: string,
): ResolvedItem {
  return { kind: 'element', element, origin, sourceFormId };
}

// --- Frontend Developer ---
const feLogo = el(
  'fe_logo',
  'logo',
  { src: '', alt: 'Northwind Labs' },
  START_ANCHOR,
);
const feHeading = el(
  'fe_heading',
  'heading',
  { text: 'Northwind Labs' },
  'fe_logo',
);
const feAboutV2 = el(
  'fe_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a Frontend Developer and help us build delightful, high-quality web experiences.</p>',
  },
  'fe_heading',
);
const feAboutV3 = el(
  'fe_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a Frontend Developer. In v3 draft we are expanding the role scope and refreshing this description.</p>',
  },
  'fe_heading',
);
const feAboutV1 = el(
  'fe_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a Frontend Developer and help us build delightful web experiences.</p>',
  },
  'fe_heading',
);

const frontendBaseFieldsV2: OwnField[] = [
  field('first_name', 'First Name', 'text', 'fe_about', { required: true }),
  field('last_name', 'Last Name', 'text', 'first_name', { required: true }),
  field('email', 'Email', 'email', 'last_name', { required: true }),
  field('phone', 'Phone', 'phone', 'email'),
  field('resume', 'Resume', 'file', 'phone', { required: true }),
  field('current_company', 'Current Company', 'text', 'resume'),
  field('experience', 'Experience', 'number', 'current_company', {
    required: true,
  }),
  field('current_ctc', 'Current CTC', 'currency', 'experience'),
  field('expected_ctc', 'Expected CTC', 'currency', 'current_ctc'),
  field('notice_period', 'Notice Period', 'select', 'expected_ctc', {
    options: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
  }),
  field('current_location', 'Current Location', 'text', 'notice_period'),
  field('portfolio_url', 'Portfolio URL', 'text', 'current_location'),
  field(
    'data_consent',
    'I agree to the processing of my data',
    'checkbox',
    'portfolio_url',
    { required: true },
  ),
];

const frontendBaseFieldsV1: OwnField[] = [
  field('first_name', 'First Name', 'text', 'fe_about', { required: true }),
  field('last_name', 'Last Name', 'text', 'first_name', { required: true }),
  field('email', 'Email', 'email', 'last_name', { required: true }),
  field('phone', 'Phone', 'phone', 'email'),
  field('resume', 'Resume', 'file', 'phone', { required: true }),
  field('current_company', 'Current Company', 'text', 'resume'),
  field('experience', 'Total experience', 'number', 'current_company', {
    required: true,
  }),
  field('current_ctc', 'Current CTC', 'currency', 'experience'),
  field('expected_ctc', 'Expected CTC', 'currency', 'current_ctc'),
  field('current_location', 'Current Location', 'text', 'expected_ctc'),
  field('portfolio_url', 'Portfolio URL', 'text', 'current_location'),
  field(
    'data_consent',
    'I agree to the processing of my data',
    'checkbox',
    'portfolio_url',
    { required: true },
  ),
];

const frontendDraftV3Fields: OwnField[] = [
  field('first_name', 'First Name', 'text', 'fe_about', { required: true }),
  field('last_name', 'Last Name', 'text', 'first_name', { required: true }),
  field('email', 'Email', 'email', 'last_name', { required: true }),
  field('phone', 'Phone', 'phone', 'email'),
  field('resume', 'Resume', 'file', 'phone', { required: true }),
  field('current_company', 'Current Company', 'text', 'resume'),
  field('experience', 'Experience', 'number', 'current_company', {
    required: true,
  }),
  field('current_ctc', 'Current CTC', 'currency', 'experience'),
  field('expected_ctc', 'Expected CTC', 'currency', 'current_ctc'),
  field('notice_period', 'Notice Period', 'select', 'expected_ctc', {
    options: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
  }),
  field('current_location', 'Current Location', 'text', 'notice_period'),
  field('portfolio_url', 'Portfolio URL', 'text', 'current_location'),
  field('github_url', 'GitHub URL', 'text', 'portfolio_url'),
  field(
    'data_consent',
    'I agree to the processing of my data',
    'checkbox',
    'github_url',
    { required: true },
  ),
];

const frontendContentV1: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'Frontend Developer Application',
    about: feAboutV1.props.html as string,
    submitLabel: 'Submit application',
    successMessage: 'Thanks for applying to Northwind Labs!',
  },
  ownFields: frontendBaseFieldsV1,
  elements: [feLogo, feHeading, feAboutV1],
  overrides: {},
  locks: ['data_consent'],
};

const frontendContentV2: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'Frontend Developer Application',
    about: feAboutV2.props.html as string,
    submitLabel: 'Submit application',
    successMessage: 'Thanks for applying to Northwind Labs!',
  },
  ownFields: frontendBaseFieldsV2,
  elements: [feLogo, feHeading, feAboutV2],
  overrides: {},
  locks: ['data_consent'],
};

const frontendDraftV3: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'Frontend Developer Application',
    about: feAboutV3.props.html as string,
    submitLabel: 'Submit application',
    successMessage: 'Thanks for applying to Northwind Labs!',
  },
  ownFields: frontendDraftV3Fields,
  elements: [feLogo, feHeading, feAboutV3],
  overrides: {},
  locks: ['data_consent'],
};

function resolvedFieldFromOwn(
  own: OwnField,
  sourceFormId: string,
  locked: boolean,
  lockedByFormId?: string,
): ResolvedField {
  return {
    key: own.key,
    label: own.label,
    type: own.type,
    placeholder: own.placeholder,
    helpText: own.helpText,
    options: own.options,
    required: own.required,
    hidden: own.hidden,
    origin: 'own',
    sourceFormId,
    locked,
    lockedByFormId,
  };
}

function makeFrontendResolvedV1(): ResolvedForm {
  const items: ResolvedItem[] = [
    rElItem(feLogo, 'own', 'form_frontend'),
    rElItem(feHeading, 'own', 'form_frontend'),
    rElItem(feAboutV1, 'own', 'form_frontend'),
    ...frontendBaseFieldsV1.map((f) =>
      rFieldItem(
        resolvedFieldFromOwn(
          f,
          'form_frontend',
          f.key === 'data_consent',
          f.key === 'data_consent' ? 'form_frontend' : undefined,
        ),
      ),
    ),
  ];
  return {
    formId: 'form_frontend',
    settings: {
      logoUrl: '',
      companyName: 'Northwind Labs',
      title: 'Frontend Developer Application',
      about: feAboutV1.props.html as string,
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying to Northwind Labs!',
    },
    items,
  };
}

function makeFrontendResolvedV2(): ResolvedForm {
  const items: ResolvedItem[] = [
    rElItem(feLogo, 'own', 'form_frontend'),
    rElItem(feHeading, 'own', 'form_frontend'),
    rElItem(feAboutV2, 'own', 'form_frontend'),
    ...frontendBaseFieldsV2.map((f) =>
      rFieldItem(
        resolvedFieldFromOwn(
          f,
          'form_frontend',
          f.key === 'data_consent',
          f.key === 'data_consent' ? 'form_frontend' : undefined,
        ),
      ),
    ),
  ];
  return {
    formId: 'form_frontend',
    settings: {
      logoUrl: '',
      companyName: 'Northwind Labs',
      title: 'Frontend Developer Application',
      about: feAboutV2.props.html as string,
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying to Northwind Labs!',
    },
    items,
  };
}

// --- Backend (child of Frontend) ---
const beAbout = el(
  'be_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a Backend Developer building reliable APIs and services.</p>',
  },
  'fe_heading',
);

const backendContentV1: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'Backend Developer Application',
    about: beAbout.props.html as string,
  },
  ownFields: [
    field('tech_stack', 'Tech Stack', 'select', 'experience', {
      options: ['Node.js', 'Java', 'Python', 'Go'],
    }),
    field('github_url', 'GitHub URL', 'text', 'current_company'),
  ],
  elements: [beAbout],
  overrides: {
    portfolio_url: { hidden: true },
    current_ctc: { required: false },
    experience: { label: 'Years of backend experience' },
  },
  locks: [],
};

function makeBackendResolvedV1(): ResolvedForm {
  // Based on Frontend v2 published + backend overrides/own fields
  const items: ResolvedItem[] = [
    rElItem(feLogo, 'inherited', 'form_frontend'),
    rElItem(feHeading, 'inherited', 'form_frontend'),
    rElItem(beAbout, 'own', 'form_backend'), // child can change about element? elements are own in content; better to treat as own element overriding by replacing anchor position? But elements don't have key override mechanism except same id? Simpler: child adds its own element; however spec says "change labels, text and settings (logo, company name, about)". Settings.about is in settings, not element necessarily. We'll include both: settings.about overridden and keep inherited about element or add own. To be safe, keep inherited about element but settings.about reflects override; renderer may use settings.about.
    rFieldItem(
      rField({
        key: 'first_name',
        label: 'First Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'last_name',
        label: 'Last Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'phone',
        label: 'Phone',
        type: 'phone',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'resume',
        label: 'Resume',
        type: 'file',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_company',
        label: 'Current Company',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'github_url',
        label: 'GitHub URL',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'own',
        sourceFormId: 'form_backend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'experience',
        label: 'Years of backend experience',
        type: 'number',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'tech_stack',
        label: 'Tech Stack',
        type: 'select',
        options: ['Node.js', 'Java', 'Python', 'Go'],
        required: false,
        hidden: false,
        origin: 'own',
        sourceFormId: 'form_backend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_ctc',
        label: 'Current CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'expected_ctc',
        label: 'Expected CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'notice_period',
        label: 'Notice Period',
        type: 'select',
        options: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_location',
        label: 'Current Location',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'portfolio_url',
        label: 'Portfolio URL',
        type: 'text',
        required: false,
        hidden: true,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'data_consent',
        label: 'I agree to the processing of my data',
        type: 'checkbox',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: true,
        lockedByFormId: 'form_frontend',
      }),
    ),
  ];
  return {
    formId: 'form_backend',
    settings: {
      logoUrl: '',
      companyName: 'Northwind Labs',
      title: 'Backend Developer Application',
      about: beAbout.props.html as string,
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying to Northwind Labs!',
    },
    items,
  };
}

// --- DevOps (child of Backend) ---
const devopsAbout = el(
  'devops_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a DevOps Engineer to scale our infrastructure and delivery pipelines.</p>',
  },
  'fe_heading',
);

const devopsContentV1: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'DevOps Engineer Application',
    about: devopsAbout.props.html as string,
  },
  ownFields: [
    field('cloud_platforms', 'Cloud Platforms', 'select', 'tech_stack', {
      options: ['AWS', 'Azure', 'GCP'],
    }),
    field('oncall_comfort', 'On-call Comfort', 'radio', 'cloud_platforms', {
      options: ['Yes', 'No', 'Maybe'],
    }),
  ],
  elements: [devopsAbout],
  overrides: {
    tech_stack: { label: 'Primary language' },
  },
  locks: [],
};

function makeDevOpsResolvedV1(): ResolvedForm {
  const items: ResolvedItem[] = [
    rElItem(feLogo, 'inherited', 'form_frontend'),
    rElItem(feHeading, 'inherited', 'form_frontend'),
    rElItem(beAbout, 'inherited', 'form_backend'),
    rElItem(devopsAbout, 'own', 'form_devops'),
    rFieldItem(
      rField({
        key: 'first_name',
        label: 'First Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'last_name',
        label: 'Last Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'phone',
        label: 'Phone',
        type: 'phone',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'resume',
        label: 'Resume',
        type: 'file',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_company',
        label: 'Current Company',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'github_url',
        label: 'GitHub URL',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_backend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'experience',
        label: 'Years of backend experience',
        type: 'number',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'tech_stack',
        label: 'Primary language',
        type: 'select',
        options: ['Node.js', 'Java', 'Python', 'Go'],
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_backend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'cloud_platforms',
        label: 'Cloud Platforms',
        type: 'select',
        options: ['AWS', 'Azure', 'GCP'],
        required: false,
        hidden: false,
        origin: 'own',
        sourceFormId: 'form_devops',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'oncall_comfort',
        label: 'On-call Comfort',
        type: 'radio',
        options: ['Yes', 'No', 'Maybe'],
        required: false,
        hidden: false,
        origin: 'own',
        sourceFormId: 'form_devops',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_ctc',
        label: 'Current CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'expected_ctc',
        label: 'Expected CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'notice_period',
        label: 'Notice Period',
        type: 'select',
        options: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_location',
        label: 'Current Location',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'portfolio_url',
        label: 'Portfolio URL',
        type: 'text',
        required: false,
        hidden: true,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'data_consent',
        label: 'I agree to the processing of my data',
        type: 'checkbox',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: true,
        lockedByFormId: 'form_frontend',
      }),
    ),
  ];
  return {
    formId: 'form_devops',
    settings: {
      logoUrl: '',
      companyName: 'Northwind Labs',
      title: 'DevOps Engineer Application',
      about: devopsAbout.props.html as string,
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying to Northwind Labs!',
    },
    items,
  };
}

// --- QA (child of Frontend) ---
const qaAbout = el(
  'qa_about',
  'richtext',
  {
    html: '<p>Join Northwind Labs as a QA Engineer ensuring our products meet the highest quality bar.</p>',
  },
  'fe_heading',
);

const qaContentV1: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'QA Engineer Application',
    about: qaAbout.props.html as string,
  },
  ownFields: [
    field('testing_tools', 'Testing Tools', 'select', 'experience', {
      options: ['Selenium', 'Cypress', 'Playwright', 'Jest'],
    }),
  ],
  elements: [qaAbout],
  overrides: {
    portfolio_url: { hidden: true },
    expected_ctc: { required: false },
    experience: { label: 'Years of testing experience' },
  },
  locks: [],
};

function makeQAResolvedV1(): ResolvedForm {
  const items: ResolvedItem[] = [
    rElItem(feLogo, 'inherited', 'form_frontend'),
    rElItem(feHeading, 'inherited', 'form_frontend'),
    rElItem(feAboutV2, 'inherited', 'form_frontend'),
    rElItem(qaAbout, 'own', 'form_qa'),
    rFieldItem(
      rField({
        key: 'first_name',
        label: 'First Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'last_name',
        label: 'Last Name',
        type: 'text',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'phone',
        label: 'Phone',
        type: 'phone',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'resume',
        label: 'Resume',
        type: 'file',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_company',
        label: 'Current Company',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'experience',
        label: 'Years of testing experience',
        type: 'number',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'testing_tools',
        label: 'Testing Tools',
        type: 'select',
        options: ['Selenium', 'Cypress', 'Playwright', 'Jest'],
        required: false,
        hidden: false,
        origin: 'own',
        sourceFormId: 'form_qa',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_ctc',
        label: 'Current CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'expected_ctc',
        label: 'Expected CTC',
        type: 'currency',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'notice_period',
        label: 'Notice Period',
        type: 'select',
        options: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'current_location',
        label: 'Current Location',
        type: 'text',
        required: false,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'portfolio_url',
        label: 'Portfolio URL',
        type: 'text',
        required: false,
        hidden: true,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: false,
      }),
    ),
    rFieldItem(
      rField({
        key: 'data_consent',
        label: 'I agree to the processing of my data',
        type: 'checkbox',
        required: true,
        hidden: false,
        origin: 'inherited',
        sourceFormId: 'form_frontend',
        locked: true,
        lockedByFormId: 'form_frontend',
      }),
    ),
  ];
  return {
    formId: 'form_qa',
    settings: {
      logoUrl: '',
      companyName: 'Northwind Labs',
      title: 'QA Engineer Application',
      about: qaAbout.props.html as string,
      submitLabel: 'Submit application',
      successMessage: 'Thanks for applying to Northwind Labs!',
    },
    items,
  };
}

// --- Internship (standalone draft) ---
const internLogo = el(
  'intern_logo',
  'logo',
  { src: '', alt: 'Northwind Labs' },
  START_ANCHOR,
);
const internHeading = el(
  'intern_heading',
  'heading',
  { text: 'Northwind Labs' },
  'intern_logo',
);
const internAbout = el(
  'intern_about',
  'richtext',
  {
    html: '<p>Apply for an internship at Northwind Labs and learn with our team.</p>',
  },
  'intern_heading',
);

const internshipDraft: FormContent = {
  settings: {
    companyName: 'Northwind Labs',
    title: 'Internship Application',
    about: internAbout.props.html as string,
    submitLabel: 'Apply',
    successMessage: 'Thanks for your interest in interning at Northwind Labs!',
  },
  ownFields: [
    field('first_name', 'First Name', 'text', 'intern_about', {
      required: true,
    }),
    field('last_name', 'Last Name', 'text', 'first_name', { required: true }),
    field('email', 'Email', 'email', 'last_name', { required: true }),
    field('phone', 'Phone', 'phone', 'email'),
    field('resume', 'Resume', 'file', 'phone', { required: true }),
    field('current_location', 'Current Location', 'text', 'resume'),
    field(
      'data_consent',
      'I agree to the processing of my data',
      'checkbox',
      'current_location',
    ),
  ],
  elements: [internLogo, internHeading, internAbout],
  overrides: {},
  locks: [],
};

const frontendV1: FormVersion = {
  id: 'ver_frontend_v1',
  formId: 'form_frontend',
  versionNumber: 1,
  status: 'published',
  content: frontendContentV1,
  resolvedSnapshot: makeFrontendResolvedV1(),
  publishedAt: iso('2026-09-10T10:00:00Z'),
};

const frontendV2: FormVersion = {
  id: 'ver_frontend_v2',
  formId: 'form_frontend',
  versionNumber: 2,
  status: 'published',
  content: frontendContentV2,
  resolvedSnapshot: makeFrontendResolvedV2(),
  publishedAt: iso('2026-10-15T10:00:00Z'),
};

const backendV1: FormVersion = {
  id: 'ver_backend_v1',
  formId: 'form_backend',
  versionNumber: 1,
  status: 'published',
  content: backendContentV1,
  resolvedSnapshot: makeBackendResolvedV1(),
  publishedAt: iso('2026-10-20T10:00:00Z'),
};

const devopsV1: FormVersion = {
  id: 'ver_devops_v1',
  formId: 'form_devops',
  versionNumber: 1,
  status: 'published',
  content: devopsContentV1,
  resolvedSnapshot: makeDevOpsResolvedV1(),
  publishedAt: iso('2026-10-25T10:00:00Z'),
};

const qaV1: FormVersion = {
  id: 'ver_qa_v1',
  formId: 'form_qa',
  versionNumber: 1,
  status: 'published',
  content: qaContentV1,
  resolvedSnapshot: makeQAResolvedV1(),
  publishedAt: iso('2026-10-22T10:00:00Z'),
};

export const mockForms: FormRecord[] = [
  {
    id: 'form_frontend',
    orgId: 'org_1',
    parentFormId: null,
    name: 'Frontend Developer',
    slug: 'frontend-developer',
    publishedVersionId: frontendV2.id,
    versions: [frontendV1, frontendV2],
    draft: frontendDraftV3,
    createdAt: iso('2026-09-01T09:00:00Z'),
    updatedAt: iso('2026-11-18T12:00:00Z'),
  },
  {
    id: 'form_backend',
    orgId: 'org_1',
    parentFormId: 'form_frontend',
    name: 'Backend Developer',
    slug: 'backend-developer',
    publishedVersionId: backendV1.id,
    versions: [backendV1],
    draft: null,
    createdAt: iso('2026-10-18T09:00:00Z'),
    updatedAt: iso('2026-10-20T10:00:00Z'),
  },
  {
    id: 'form_devops',
    orgId: 'org_1',
    parentFormId: 'form_backend',
    name: 'DevOps Engineer',
    slug: 'devops-engineer',
    publishedVersionId: devopsV1.id,
    versions: [devopsV1],
    draft: null,
    createdAt: iso('2026-10-24T09:00:00Z'),
    updatedAt: iso('2026-10-25T10:00:00Z'),
  },
  {
    id: 'form_qa',
    orgId: 'org_1',
    parentFormId: 'form_frontend',
    name: 'QA Engineer',
    slug: 'qa-engineer',
    publishedVersionId: qaV1.id,
    versions: [qaV1],
    draft: null,
    createdAt: iso('2026-10-21T09:00:00Z'),
    updatedAt: iso('2026-10-22T10:00:00Z'),
  },
  {
    id: 'form_internship',
    orgId: 'org_1',
    parentFormId: null,
    name: 'Internship Application',
    slug: 'internship-application',
    publishedVersionId: null,
    versions: [],
    draft: internshipDraft,
    createdAt: iso('2026-11-10T09:00:00Z'),
    updatedAt: iso('2026-11-10T09:00:00Z'),
  },
];
