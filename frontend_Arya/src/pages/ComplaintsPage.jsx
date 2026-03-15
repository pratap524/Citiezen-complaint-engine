import React, { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import usePageStyle from '../utils/usePageStyle';
import { getAdminIdentity, getAdminSessionInfo } from '../utils/adminAuth';
import { getComplaints, getComplaintsByDepartment, updateComplaintStatus } from '../utils/api';

const formatDate = (isoDate) => {
  const dateObject = new Date(isoDate);
  if (Number.isNaN(dateObject.getTime())) {
    return isoDate;
  }

  return dateObject.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const toCssToken = (value) => value.toLowerCase().replace(/\s+/g, '-');
const DEFAULT_DEPARTMENTS = [
  'Sanitation',
  'Roads',
  'Water',
  'Electricity',
  'Animal Control',
  'Illegal Construction',
  'Other'
];

function FilterDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <span>{selectedOption.label}</span>
      </button>

      <ul className="custom-select-menu" role="listbox" aria-label={label}>
        {options.map((option) => (
          <li key={option.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const mapRecord = (item) => {
  const numericPriorityScore = typeof item.urgencyScore === 'number'
    ? item.urgencyScore
    : (typeof item.priorityScore === 'number' ? item.priorityScore : 0);
  const priorityScore = Math.max(0, Math.min(10, Math.round(numericPriorityScore)));
  const priorityLevel = priorityScore >= 8 ? 'High' : priorityScore >= 5 ? 'Medium' : 'Low';

  return {
    id: item._id,
    citizen: 'Registered Citizen',
    ward: 'Ward N/A',
    category: item.category || item.keyTags?.[0] || 'General',
    priority: priorityScore,
    priorityBand: priorityLevel,
    date: item.createdAt,
    status: item.status,
    department: item.department || 'Other'
  };
};

export default function ComplaintsPage() {
  usePageStyle('/complaints.css');

  const { isAuthenticated, isGovernment, session } = getAdminSessionInfo();
  const { adminName, adminAvatar } = useMemo(() => getAdminIdentity(session), [session]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [department, setDepartment] = useState('all');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getComplaintsByDepartment()
      .then((payload) => {
        if (ignore) {
          return;
        }

        const groupedDepartments = Array.isArray(payload?.departments) ? payload.departments : [];
        const mapped = groupedDepartments
          .flatMap((departmentGroup) => Array.isArray(departmentGroup.complaints) ? departmentGroup.complaints : [])
          .map(mapRecord);

        setRecords(mapped);
      })
      .catch(async () => {
        if (ignore) {
          return;
        }

        try {
          const items = await getComplaints();
          if (ignore) {
            return;
          }
          setRecords(Array.isArray(items) ? items.map(mapRecord) : []);
        } catch {
          if (!ignore) {
            setRecords([]);
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isGovernment) {
    return <Navigate to="/" replace />;
  }

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [
      record.id,
      record.citizen,
      record.ward,
      record.category,
      record.department,
      record.status
    ].some((field) => field.toLowerCase().includes(query));

    const matchesStatus = status === 'all' || record.status === status;
    const matchesPriority = priority === 'all' || record.priorityBand === priority;
    const matchesDepartment = department === 'all' || record.department === department;
    return matchesQuery && matchesStatus && matchesPriority && matchesDepartment;
  });

  const departmentOptions = [...new Set([...DEFAULT_DEPARTMENTS, ...records.map((record) => record.department).filter(Boolean)])]
    .sort((first, second) => first.localeCompare(second));

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' }
  ];

  const filterDepartmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departmentOptions.map((departmentName) => ({ value: departmentName, label: departmentName }))
  ];

  const groupedRecords = filteredRecords.reduce((accumulator, record) => {
    const key = record.department || 'Other';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(record);
    return accumulator;
  }, {});

  const groupedDepartments = Object.entries(groupedRecords)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setPriority('all');
    setDepartment('all');
  };

  const onStatusUpdate = async (id, nextStatus) => {
    try {
      await updateComplaintStatus(id, nextStatus);
      setRecords((current) => current.map((record) => (record.id === id ? { ...record, status: nextStatus } : record)));
    } catch {
      // no-op
    }
  };

  return (
    <div className="admin-app">
      <AdminSidebar activeRoute="complaints" />

      <section className="main-area">
        <AdminTopbar
          searchPlaceholder="Search by ID, ward, category, or citizen..."
          alertCount={3}
          adminName={adminName}
          adminAvatar={adminAvatar}
          onSearchChange={(event) => setSearch(event.target.value)}
        />

        <main className="content">
          <h1>All Complaints</h1>
          <p className="subhead">Comprehensive registry of civic complaints across wards and departments</p>

          <section className="summary-grid">
            <article className="summary-card"><p>Total Complaints</p><h2>{filteredRecords.length}</h2></article>
            <article className="summary-card"><p>Open Complaints</p><h2>{filteredRecords.filter((record) => record.status !== 'Resolved').length}</h2></article>
            <article className="summary-card"><p>Resolved</p><h2>{filteredRecords.filter((record) => record.status === 'Resolved').length}</h2></article>
            <article className="summary-card"><p>High Priority</p><h2>{filteredRecords.filter((record) => record.priority >= 8).length}</h2></article>
          </section>

          <section className="filters panel">
            <div className="filter-item">
              <label htmlFor="statusFilter">Status</label>
              <FilterDropdown label="Status" value={status} options={statusOptions} onChange={setStatus} />
            </div>

            <div className="filter-item">
              <label htmlFor="priorityFilter">Priority</label>
              <FilterDropdown label="Priority" value={priority} options={priorityOptions} onChange={setPriority} />
            </div>

            <div className="filter-item">
              <label htmlFor="departmentFilter">Department</label>
              <FilterDropdown label="Department" value={department} options={filterDepartmentOptions} onChange={setDepartment} />
            </div>

            <button className="reset-btn" type="button" onClick={resetFilters}>Reset Filters</button>
          </section>

          <section className="table-panel panel">
            <div className="table-head"><h3>Complaint Register</h3><span>{filteredRecords.length} records</span></div>

            <div className="table-wrap">
              {isLoading && <p className="no-data">Loading complaints...</p>}
              {!isLoading && groupedDepartments.map(([departmentName, departmentRecords]) => (
                <section className="department-group" key={departmentName}>
                  <div className="department-head">
                    <h4>{departmentName}</h4>
                    <span>{departmentRecords.length} complaints</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Complaint ID</th><th>Citizen</th><th>Ward</th><th>Category</th><th>Priority</th><th>Date</th><th>Status</th><th>Department</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="id-cell">{record.id}</td>
                          <td>{record.citizen}</td>
                          <td>{record.ward}</td>
                          <td>{record.category}</td>
                          <td><span className={`badge priority-${toCssToken(record.priorityBand)}`}>{record.priority} / 10</span></td>
                          <td>{formatDate(record.date)}</td>
                          <td><span className={`badge status-${toCssToken(record.status)}`}>{record.status}</span></td>
                          <td>{record.department}</td>
                          <td>
                            <select value={record.status} onChange={(event) => onStatusUpdate(record.id, event.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
              {filteredRecords.length === 0 && <p className="no-data">No complaints found for the selected filters.</p>}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}
