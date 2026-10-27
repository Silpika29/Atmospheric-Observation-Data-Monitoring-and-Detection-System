import React from 'react';
import { 
  Building2, 
  Radio, 
  Cpu, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Layers, 
  BookOpen,
  Server
} from 'lucide-react';

export const AboutProjectPage: React.FC = () => {
  const instruments = [
    {
      name: 'Advanced Indian MST Radar',
      frequency: '53 MHz',
      description: 'Mesosphere-Stratosphere-Troposphere radar system designed for continuous high-resolution wind field velocity and atmospheric turbulence profiling.',
      role: 'Upper and middle atmospheric dynamics, wind vector derivation, and wave phenomena.'
    },
    {
      name: 'Rayleigh Doppler Lidar',
      frequency: 'Optical / Laser',
      description: 'Active optical remote sensing instrument emitting pulsed laser beams to probe molecular backscattering in the stratosphere and mesosphere.',
      role: 'Derives middle-atmospheric thermal structure, density variations, and vertical wind profiles.'
    },
    {
      name: '445 MHz Wind Profiling Radar',
      frequency: '445 MHz (UHF)',
      description: 'UHF boundary-layer radar operating continuously to monitor horizontal and vertical atmospheric winds with high vertical resolution.',
      role: 'Boundary layer meteorology, low-level jets, and convective weather development.'
    },
    {
      name: 'X-Band Doppler Weather Radar',
      frequency: 'X-Band (8-12 GHz)',
      description: 'High-frequency radar suited for localized cloud microphysics, severe rainfall tracking, and precipitation particle identification.',
      role: 'Severe weather surveillance, storm cell tracking, and cloud microphysical processes.'
    },
    {
      name: 'High-Performance Computing (HPC)',
      frequency: 'Multi-Node Cluster',
      description: 'High-performance scientific computing facilities supporting parallel simulations, numerical weather prediction (NWP), and large-scale data storage.',
      role: 'Executes compute-intensive atmospheric models and stores terabytes of raw instrument telemetry.'
    }
  ];

  const internshipWeeks = [
    {
      week: 'Week 1',
      title: 'Orientation, Networking, Storage & Atmospheric Research Overview',
      details: 'Introduction to NARL campus, CDMG organizational functions, enterprise data center architecture, high-throughput network topologies, centralized SAN/NAS storage arrays, and atmospheric observation fundamentals.'
    },
    {
      week: 'Week 2',
      title: 'MST Radar & Rayleigh Doppler Lidar Principles',
      details: 'In-depth study of radio frequency radar echo mechanisms, Doppler beam swinging (DBS) techniques, Rayleigh lidar backscatter, optical signal-to-noise ratio, and atmospheric boundary-layer parameters.'
    },
    {
      week: 'Week 3',
      title: 'Computing Facilities, HPC & Scientific Data Management',
      details: 'Study of HPC cluster job scheduling (SLURM/PBS), distributed file systems, high-bandwidth interconnects, data archival protocols, and scientific database structures supporting NARL research scientists.'
    },
    {
      week: 'Week 4',
      title: 'Scientific Computing, Storage & Data-Processing Concepts',
      details: 'Exploration of Python data engineering libraries (NumPy, Pandas), scientific CSV/NetCDF/HDF5 data structures, automated quality control (QC) methodologies, and statistical data cleaning pipelines.'
    },
    {
      week: 'Week 5',
      title: 'Planning the Python Atmospheric Data-Monitoring Project',
      details: 'System architecture definition, designing the REST API contracts with FastAPI, defining threshold-based validation algorithms for temperature, humidity, and wind speed, and prototyping the React dashboard interface.'
    },
    {
      week: 'Week 6',
      title: 'Review, Documentation, Data Validation, Visualization & Export Workflow',
      details: 'Integration of React interactive charting with backend endpoints, comprehensive unit and endpoint testing, anomaly reporting export generation, technical report compilation, and final project demonstration.'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="bg-[#0f2b48] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5" />
            <span>Six-Week Academic Internship Project</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Atmospheric Observation Data Monitoring and Anomaly Detection System
          </h1>

          <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
            Developed in association with the <strong>Computer & Data Management Group (CDMG)</strong> at the{' '}
            <strong>National Atmospheric Research Laboratory (NARL)</strong>, Department of Space, Government of India.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-sky-200">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              NARL, Gadanki, Tirupati, India
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" />
              Computer & Data Management Group (CDMG)
            </span>
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-sky-400" />
              Educational Prototype
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="font-bold text-amber-950 text-sm">
            Important Educational Demonstration Notice
          </h2>
          <p className="leading-relaxed text-amber-800">
            This application is an educational internship software prototype developed to demonstrate automated CSV parsing, rule-based data validation, interactive time-series visualization, and anomaly reporting. 
            <strong> The system operates entirely in Sample Data Mode using synthetic records.</strong> It does not claim direct network connectivity to live NARL operational radar instruments, real-time lidar telemetry feeds, or institutional production servers.
          </p>
        </div>
      </div>

      {/* Institutional Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 text-sky-800">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-800">Organizational Vision</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong>National Atmospheric Research Laboratory (NARL)</strong> is an autonomous research institution under the Department of Space, Government of India. NARL’s research focuses on understanding the complex mechanisms of the atmosphere through world-class ground-based scientific observation, radar technology, and advanced data analysis.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 text-emerald-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-800">CDMG Mission</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong>Computer & Data Management Group (CDMG)</strong> provides the vital technical backbone for NARL. CDMG manages high-capacity data acquisition, multi-terabyte storage infrastructure, networking, and High-Performance Computing (HPC) facilities that enable scientists to store, process, and analyze massive volumes of atmospheric observations.
          </p>
        </div>
      </div>

      {/* Relevant Technologies & Instruments Studied */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-600" />
            <span>Atmospheric Observation Instruments & Technologies Studied</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            During the internship, key state-of-the-art atmospheric sounding instruments and computing infrastructure at NARL were examined:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {instruments.map((inst, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">{inst.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-semibold">
                    {inst.frequency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  {inst.description}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Scientific Role:</span> {inst.role}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 italic bg-sky-50/50 p-2.5 rounded-lg border border-sky-100 mt-2">
          <strong>Note:</strong> These instruments support atmospheric observation research, while High-Performance Computing (HPC) provides the computational foundation for scientific processing and modeling.
        </p>
      </div>

      {/* Six-Week Internship Learning Summary */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Six-Week Internship Learning Curriculum</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Weekly progression from atmospheric radar concepts to Python data processing and full-stack web implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {internshipWeeks.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-sky-300 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-sky-100 text-sky-800">
                  {item.week}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                {item.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Software Architecture & Technical Stack */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>Implemented Software Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-2 text-sm text-sky-800">
              1. Frontend Presentation
            </span>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>React 19 + TypeScript</strong> for modular UI</li>
              <li>• <strong>Vite</strong> for ultra-fast HMR and bundling</li>
              <li>• <strong>Tailwind CSS</strong> for scientific dashboard styling</li>
              <li>• <strong>Recharts</strong> for responsive interactive graphs</li>
              <li>• <strong>Lucide React</strong> for clean scientific iconography</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-2 text-sm text-emerald-800">
              2. Backend Application
            </span>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>Python 3.12 + FastAPI</strong> for RESTful API</li>
              <li>• <strong>Pydantic v2</strong> for strict schema validation</li>
              <li>• <strong>Uvicorn</strong> ASGI production web server</li>
              <li>• <strong>Pytest</strong> automated test suite (18 test cases)</li>
              <li>• Dual Mode: Web server & CLI demonstration</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-2 text-sm text-orange-800">
              3. Data Engine & Quality Control
            </span>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>Pandas & NumPy</strong> for CSV parsing & manipulation</li>
              <li>• Deterministic rule-based threshold engine</li>
              <li>• Multi-anomaly and missing value preservation</li>
              <li>• Safe CSV export for processed data and audit logs</li>
              <li>• Bundled synthetic demonstration dataset</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
