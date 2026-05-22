"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Camera, FileText, CheckCircle, Truck, Package, PenTool } from "lucide-react";
import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";

interface PreTripPacketModalProps {
  load: LoadV2;
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
  collapsed: boolean;
}

interface PhotoZone {
  id: string;
  label: string;
  subLabel: string;
  captured: boolean;
}

export function PreTripPacketModal({ load, onClose }: PreTripPacketModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [driverDocs, setDriverDocs] = useState<ChecklistSection[]>([
    {
      title: "DRIVER CREDENTIALS",
      collapsed: false,
      items: [
        { id: "cdl", label: "Commercial Driver's License (CDL-A) — Valid & on person", checked: false },
        { id: "medcert", label: "USDOT Medical Certificate — Current & not expired", checked: false },
        { id: "eld", label: "Driver ELD / Hours of Service Log — Reviewed & reset", checked: false },
        { id: "clearinghouse", label: "Drug & Alcohol Clearinghouse Auth — Confirmed", checked: false },
        { id: "badge", label: "Driver ID / Company Badge — Present", checked: false }
      ]
    },
    {
      title: "REGULATORY",
      collapsed: false,
      items: [
        { id: "drugtest", label: "FMCSA Drug Test Clearance — On file", checked: false },
        { id: "authority", label: "Motor Carrier Authority — Verified", checked: false },
        { id: "permits", label: "State-Specific Permits (if required) — N/A or confirmed", checked: false }
      ]
    }
  ]);

  const [vehicleInspection, setVehicleInspection] = useState<ChecklistSection[]>([
    {
      title: "ENGINE & UNDER HOOD",
      collapsed: false,
      items: [
        { id: "oil", label: "Engine oil level — Adequate", checked: false },
        { id: "coolant", label: "Coolant level — Full, no leaks", checked: false },
        { id: "ps_fluid", label: "Power steering fluid — Adequate", checked: false },
        { id: "belts", label: "Belts & hoses — No cracks or fraying", checked: false },
        { id: "battery", label: "Battery — Secure, terminals clean", checked: false },
        { id: "air_filter", label: "Air filter — Not clogged", checked: false }
      ]
    },
    {
      title: "TIRES & WHEELS (Tractor)",
      collapsed: false,
      items: [
        { id: "tread", label: "Tread depth ≥ 4/32\" steering / ≥ 2/32\" drive", checked: false },
        { id: "inflation", label: "Tire inflation — Properly inflated, no bulges", checked: false },
        { id: "lug_nuts", label: "Lug nuts — All present and tight", checked: false },
        { id: "valve_stems", label: "Valve stems — Caps present", checked: false }
      ]
    },
    {
      title: "BRAKES",
      collapsed: false,
      items: [
        { id: "svc_brake", label: "Service brakes — Functional, no sponge or pull", checked: false },
        { id: "park_brake", label: "Parking/Emergency brake — Engages and holds", checked: false },
        { id: "air_lines", label: "Air lines — No leaks, proper connection", checked: false },
        { id: "air_psi", label: "Air pressure builds to 100 PSI within 2 min", checked: false }
      ]
    },
    {
      title: "LIGHTS & SIGNALS",
      collapsed: false,
      items: [
        { id: "headlights", label: "Headlights (high & low beam) — Functioning", checked: false },
        { id: "brake_lights", label: "Brake lights — Functioning", checked: false },
        { id: "turn_signals", label: "Turn signals (all 4) — Functioning", checked: false },
        { id: "hazards", label: "Hazard lights — Functioning", checked: false },
        { id: "clearance", label: "Clearance / marker lights — All lit", checked: false },
        { id: "reverse", label: "Reverse lights — Functioning", checked: false }
      ]
    },
    {
      title: "EXTERIOR & SAFETY",
      collapsed: false,
      items: [
        { id: "windshield", label: "Windshield — No cracks in driver's view", checked: false },
        { id: "mirrors", label: "Mirrors — Clean, properly adjusted", checked: false },
        { id: "horn", label: "Horn — Audible", checked: false },
        { id: "wipers", label: "Wipers & washer fluid — Working", checked: false },
        { id: "reflectors", label: "Reflectors / mud flaps — Present", checked: false }
      ]
    },
    {
      title: "EMERGENCY EQUIPMENT",
      collapsed: false,
      items: [
        { id: "extinguisher", label: "Fire extinguisher — Charged, mounted accessible", checked: false },
        { id: "triangles", label: "Warning triangles / flares — Set of 3", checked: false },
        { id: "first_aid", label: "First aid kit — Stocked", checked: false },
        { id: "fuses", label: "Spare fuses — Present", checked: false }
      ]
    },
    {
      title: `TRAILER INSPECTION — ${load.trailer}`,
      collapsed: false,
      items: [
        { id: "fifth_wheel", label: "Fifth-wheel coupling — Locked, kingpin secure", checked: false },
        { id: "landing_gear", label: "Landing gear — Fully raised, crank stowed", checked: false },
        { id: "trailer_air", label: "Air lines & electrical connections — Secure, no leaks", checked: false },
        { id: "trailer_tires", label: "Trailer tires — Inflated, no damage (all positions)", checked: false },
        { id: "trailer_lights", label: "Trailer lights — Brake, turn, clearance functioning", checked: false },
        { id: "rear_doors", label: "Rear doors — Secured, hinges intact", checked: false },
        { id: "door_seals", label: `Door seals — Intact · Seal: ${load.sealPickup}`, checked: false },
        { id: "cargo_secure", label: "Cargo securement — Straps/chains checked, load stable", checked: false },
        { id: "reefer", label: "Reefer unit (if temp-controlled) — Set to correct temp", checked: false }
      ]
    }
  ]);

  const [photos, setPhotos] = useState<PhotoZone[]>([
    { id: "photo_cdl", label: "Driver with CDL", subLabel: "Driver holding CDL next to truck door", captured: false },
    { id: "photo_selfie", label: "Driver Selfie (Dash Cam)", subLabel: "Face clearly visible, in cab", captured: false },
    { id: "photo_front", label: "Truck Front", subLabel: "Full front view, license plate visible", captured: false },
    { id: "photo_driver_side", label: "Truck Driver Side", subLabel: "Full driver-side profile", captured: false },
    { id: "photo_pass_side", label: "Truck Passenger Side", subLabel: "Full passenger-side profile", captured: false },
    { id: "photo_fifthwheel", label: "Fifth Wheel / Coupling", subLabel: "Close-up of kingpin lock", captured: false },
    { id: "photo_seal", label: "Trailer Rear + Seal", subLabel: `Doors closed · Seal: ${load.sealPickup}`, captured: false },
    { id: "photo_eld", label: "Dashboard / ELD Screen", subLabel: "Odometer, ELD status, duty status", captured: false },
    { id: "photo_fuel", label: "Fuel Receipt", subLabel: "Current fuel level or receipt", captured: false }
  ]);

  const [loadDocuments, setLoadDocuments] = useState<ChecklistItem[]>([
    { id: "doc_rc", label: `Rate Confirmation (${load.rc}) — Signed copy on file`, checked: false },
    { id: "doc_bol", label: `Bill of Lading (${load.bol}) — Original with driver`, checked: false },
    { id: "doc_po", label: `Customer PO (${load.po}) — Confirmed with shipper`, checked: false },
    { id: "doc_lumper", label: `Lumper Receipt Authorization — ${load.lumper > 0 ? 'Pre-authorized $' + load.lumper : 'N/A'}`, checked: false },
    { id: "doc_fuel", label: "Fuel Card / IFTA Authorization — Issued", checked: false },
    { id: "doc_permits", label: "Oversize / Hazmat Permits — N/A", checked: false },
    { id: "doc_insurance", label: "Proof of Insurance Certificate — On file", checked: false },
    { id: "doc_emergency", label: "Emergency Contact Sheet — In cab", checked: false }
  ]);

  const [driverName, setDriverName] = useState(load.driver);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const tabs = [
    { id: 0, label: "📄 Driver Docs", icon: FileText },
    { id: 1, label: "🚛 Vehicle Inspection", icon: Truck },
    { id: 2, label: "📸 Photo Packet", icon: Camera },
    { id: 3, label: "📦 Load Documents", icon: Package },
    { id: 4, label: "✍️ Sign-Off", icon: PenTool }
  ];

  // Calculate progress
  const calculateProgress = () => {
    const driverDocsChecked = driverDocs.reduce((acc, section) => 
      acc + section.items.filter(item => item.checked).length, 0);
    const driverDocsTotal = driverDocs.reduce((acc, section) => acc + section.items.length, 0);
    
    const vehicleChecked = vehicleInspection.reduce((acc, section) => 
      acc + section.items.filter(item => item.checked).length, 0);
    const vehicleTotal = vehicleInspection.reduce((acc, section) => acc + section.items.length, 0);
    
    const photosCaptured = photos.filter(photo => photo.captured).length;
    const photosTotal = photos.length;
    
    const loadDocsChecked = loadDocuments.filter(doc => doc.checked).length;
    const loadDocsTotal = loadDocuments.length;
    
    const totalChecked = driverDocsChecked + vehicleChecked + photosCaptured + loadDocsChecked;
    const totalItems = driverDocsTotal + vehicleTotal + photosTotal + loadDocsTotal;
    
    return totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;
  };

  const toggleCheckItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...driverDocs];
    newSections[sectionIndex].items[itemIndex].checked = !newSections[sectionIndex].items[itemIndex].checked;
    setDriverDocs(newSections);
  };

  const toggleVehicleItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...vehicleInspection];
    newSections[sectionIndex].items[itemIndex].checked = !newSections[sectionIndex].items[itemIndex].checked;
    setVehicleInspection(newSections);
  };

  const togglePhoto = (photoIndex: number) => {
    const newPhotos = [...photos];
    newPhotos[photoIndex].captured = !newPhotos[photoIndex].captured;
    setPhotos(newPhotos);
  };

  const toggleLoadDocument = (docIndex: number) => {
    const newDocs = [...loadDocuments];
    newDocs[docIndex].checked = !newDocs[docIndex].checked;
    setLoadDocuments(newDocs);
  };

  const toggleSection = (sectionIndex: number, type: 'driver' | 'vehicle') => {
    if (type === 'driver') {
      const newSections = [...driverDocs];
      newSections[sectionIndex].collapsed = !newSections[sectionIndex].collapsed;
      setDriverDocs(newSections);
    } else {
      const newSections = [...vehicleInspection];
      newSections[sectionIndex].collapsed = !newSections[sectionIndex].collapsed;
      setVehicleInspection(newSections);
    }
  };

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    if ('touches' in e) {
      ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    } else {
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if ('touches' in e) {
      ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    } else {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (activeTab === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const progress = calculateProgress();
  const capturedPhotos = photos.filter(p => p.captured).length;

  const renderChecklistSection = (section: ChecklistSection, sectionIndex: number, onToggle: (sectionIdx: number, itemIdx: number) => void, onToggleSection: (sectionIdx: number) => void) => (
    <div key={section.title} className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => onToggleSection(sectionIndex)}
        className="w-full px-4 py-3 bg-slate-800/50 hover:bg-slate-800/70 flex items-center justify-between transition-colors"
      >
        <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{section.title}</span>
        {section.collapsed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {!section.collapsed && (
        <div className="p-4 space-y-3">
          {section.items.map((item, itemIndex) => (
            <div key={item.id} className="flex items-start gap-3">
              <button
                onClick={() => onToggle(sectionIndex, itemIndex)}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                  item.checked 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-blue-400/50 hover:border-blue-400'
                }`}
              >
                {item.checked && <CheckCircle className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm ${item.checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-4xl bg-slate-900 border-l border-blue-500/30 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-blue-500/20 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            PRE-TRIP INSPECTION PACKET
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {load.id}
          </div>
          <div className="text-sm text-slate-400 mb-3">
            {load.driver} · {load.driverId}
          </div>
          
          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400">
              Truck: {load.truck}
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-400">
              Trailer: {load.trailer}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-400">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Packet Completion</span>
              <span className="text-sm font-bold text-blue-400">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-700 px-6 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab 0: Driver Documents */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {driverDocs.map((section, sectionIndex) => 
                renderChecklistSection(section, sectionIndex, toggleCheckItem, (idx) => toggleSection(idx, 'driver'))
              )}
            </div>
          )}

          {/* Tab 1: Vehicle Inspection */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {vehicleInspection.slice(0, 5).map((section, sectionIndex) => 
                  renderChecklistSection(section, sectionIndex, toggleVehicleItem, (idx) => toggleSection(idx, 'vehicle'))
                )}
              </div>
              {vehicleInspection.slice(5).map((section, sectionIndex) => 
                renderChecklistSection(section, sectionIndex + 5, toggleVehicleItem, (idx) => toggleSection(idx + 5, 'vehicle'))
              )}
            </div>
          )}

          {/* Tab 2: Photo Packet */}
          {activeTab === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Required Pre-Departure Photos</h3>
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-medium text-blue-400">
                  {capturedPhotos} / 9 Photos Captured
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photos.indexOf(photo))}
                    className={`relative p-6 border-2 rounded-xl transition-all ${
                      photo.captured
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10'
                    }`}
                  >
                    <Camera className={`w-8 h-8 mx-auto mb-3 ${photo.captured ? 'text-emerald-400' : 'text-blue-400'}`} />
                    <div className="text-sm font-medium text-white mb-1">{photo.label}</div>
                    <div className="text-xs text-slate-400">{photo.subLabel}</div>
                    {photo.captured && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Load Documents */}
          {activeTab === 3 && (
            <div className="space-y-4">
              {/* Load Info Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Load:</span>
                    <span className="text-white font-medium ml-2">{load.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">BOL:</span>
                    <span className="text-blue-400 font-medium ml-2 font-mono">{load.bol}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">RC:</span>
                    <span className="text-blue-400 font-medium ml-2 font-mono">{load.rc}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">PO:</span>
                    <span className="text-blue-400 font-medium ml-2 font-mono">{load.po}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-white font-medium ml-2">{load.customer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Consignee:</span>
                    <span className="text-white font-medium ml-2">{load.consignee}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400">Origin:</span>
                    <span className="text-white font-medium ml-2">{load.pickupAddr}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400">Destination:</span>
                    <span className="text-white font-medium ml-2">{load.deliveryAddr}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Commodity:</span>
                    <span className="text-white font-medium ml-2">{load.commodity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Weight:</span>
                    <span className="text-white font-medium ml-2">{load.weight}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Pallets:</span>
                    <span className="text-white font-medium ml-2">{load.pallets}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Pickup:</span>
                    <span className="text-white font-medium ml-2">{load.pickupDate} ({load.pickupWindow})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Delivery:</span>
                    <span className="text-white font-medium ml-2">{load.deliveryDate} ({load.deliveryWindow})</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400">Broker:</span>
                    <span className="text-white font-medium ml-2">{load.broker} ({load.brokerMC})</span>
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="space-y-3">
                {loadDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleLoadDocument(loadDocuments.indexOf(doc))}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all mt-0.5 ${
                        doc.checked 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-blue-400/50 hover:border-blue-400'
                      }`}
                    >
                      {doc.checked && <CheckCircle className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm ${doc.checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {doc.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Sign-Off */}
          {activeTab === 4 && (
            <div className="space-y-6">
              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Driver Documents</span>
                    <span className="text-sm font-medium text-blue-400">
                      {Math.round((driverDocs.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0) / driverDocs.reduce((acc, s) => acc + s.items.length, 0)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(driverDocs.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0) / driverDocs.reduce((acc, s) => acc + s.items.length, 0)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Vehicle Inspection</span>
                    <span className="text-sm font-medium text-blue-400">
                      {Math.round((vehicleInspection.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0) / vehicleInspection.reduce((acc, s) => acc + s.items.length, 0)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(vehicleInspection.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0) / vehicleInspection.reduce((acc, s) => acc + s.items.length, 0)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Photos</span>
                    <span className="text-sm font-medium text-blue-400">
                      {Math.round((capturedPhotos / photos.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(capturedPhotos / photos.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Load Documents</span>
                    <span className="text-sm font-medium text-blue-400">
                      {Math.round((loadDocuments.filter(d => d.checked).length / loadDocuments.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(loadDocuments.filter(d => d.checked).length / loadDocuments.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Overall Readiness */}
              <div className="text-center py-6">
                <div className={`text-4xl font-bold mb-2 ${progress === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {progress}%
                </div>
                <div className="text-sm text-slate-400">Overall Readiness Score</div>
              </div>

              {/* Certification Block */}
              <div className="bg-slate-800/50 border-l-4 border-amber-500 rounded-lg p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  By signing below, I certify that I have completed the pre-trip inspection
                  in accordance with FMCSA regulations (49 CFR §392.7 and §396.13), that the
                  vehicle is in safe operating condition, and that all required documents
                  are present and accounted for. I understand that falsifying this inspection
                  report is a violation of federal law.
                </p>
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {/* Timestamp */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Timestamp</label>
                <input
                  type="text"
                  value={new Date().toLocaleString()}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Electronic Signature</label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  onClick={clearSignature}
                  className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Signature
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    alert(`Draft saved for ${load.id} · ${new Date().toLocaleString()}`);
                  }}
                  className="px-6 py-2 border border-blue-500 text-blue-400 rounded-lg font-medium hover:bg-blue-500/10 transition-colors"
                >
                  💾 Save Draft
                </button>
                <button 
                  onClick={() => {
                    alert(`✅ Pre-Trip Packet Submitted · Packet ID: PT-${load.id}-${Date.now()} · ${new Date().toLocaleString()}`);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  📤 Submit Packet
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-2 border border-blue-500 text-blue-400 rounded-lg font-medium hover:bg-blue-500/10 transition-colors"
                >
                  🖨️ Print Packet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
