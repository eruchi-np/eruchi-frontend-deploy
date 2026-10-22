import { useState, useEffect, useMemo } from "react";
import { groupedMunicipalities, getMaxWards } from "../../../utils/municipalityData";
import {
  ACTIVITY_OPTIONS,
  EMPTY_ADVANCED,
  countActiveAdvanced,
} from "./userManagementFilters";

export default function useUserListQuery({
  fetchUsers,
  exportUserEmails,
  handlePageChange,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState(EMPTY_ADVANCED);
  const [advancedApplied, setAdvancedApplied] = useState(EMPTY_ADVANCED);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState("promotional");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [addressMunicipality, setAddressMunicipality] = useState("");
  const [addressWard, setAddressWard] = useState("");
  const [listLoading, setListLoading] = useState(true);

  const buildFilters = (overrides = {}) => ({
    activity: activityFilter,
    q: searchTerm,
    ...advancedApplied,
    ...overrides,
  });

  useEffect(() => {
    let cancelled = false;
    const delay = searchTerm ? 300 : 0;
    const t = setTimeout(async () => {
      setListLoading(true);
      try {
        await fetchUsers(buildFilters({ q: searchTerm }), 1);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // Intentionally only react to search; other filters call fetchUsers directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = () => setFilterDropdownOpen(false);
    if (filterDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [filterDropdownOpen]);

  const handleActivityFilter = (activity) => {
    setActivityFilter(activity);
    setFilterDropdownOpen(false);
    fetchUsers(buildFilters({ activity }), 1);
  };

  const applyAdvanced = () => {
    setAdvancedApplied(advancedDraft);
    fetchUsers(
      {
        activity: activityFilter,
        q: searchTerm,
        ...advancedDraft,
      },
      1
    );
  };

  const clearAdvanced = () => {
    setAdvancedDraft(EMPTY_ADVANCED);
    setAdvancedApplied(EMPTY_ADVANCED);
    setAddressQuery("");
    setAddressMunicipality("");
    setAddressWard("");
    setAddressMenuOpen(false);
    fetchUsers({ activity: activityFilter, q: searchTerm, ...EMPTY_ADVANCED }, 1);
  };

  const filteredMunicipalities = useMemo(() => {
    const query = addressQuery.trim().toLowerCase();
    if (!query) return {};
    const groups = {};
    let shown = 0;
    for (const [type, municipalities] of Object.entries(groupedMunicipalities)) {
      const matches = municipalities.filter((municipality) =>
        municipality.name.toLowerCase().includes(query)
      );
      if (!matches.length || shown >= 40) continue;
      const slice = matches.slice(0, 40 - shown);
      groups[type] = slice;
      shown += slice.length;
    }
    return groups;
  }, [addressQuery]);

  const addAddress = () => {
    if (!addressMunicipality || !addressWard) return;
    const allWards = addressWard === "*";
    const ward = allWards ? null : Number(addressWard);
    const maxWards = getMaxWards(addressMunicipality);
    if (!allWards && (!Number.isInteger(ward) || ward < 1 || ward > maxWards)) return;
    setAdvancedDraft((prev) => {
      const addresses = prev.addresses || [];
      const sameTown = (item) => item.municipality === addressMunicipality;
      if (allWards) {
        if (addresses.some((item) => sameTown(item) && item.ward == null)) return prev;
        return {
          ...prev,
          addresses: [
            ...addresses.filter((item) => !sameTown(item)),
            { municipality: addressMunicipality, ward: null },
          ],
        };
      }
      if (addresses.some((item) => sameTown(item) && (item.ward == null || item.ward === ward))) {
        return prev;
      }
      return { ...prev, addresses: [...addresses, { municipality: addressMunicipality, ward }] };
    });
    setAddressWard("");
  };

  const removeAddress = (municipality, ward) => {
    setAdvancedDraft((prev) => ({
      ...prev,
      addresses: (prev.addresses || []).filter(
        (item) => !(item.municipality === municipality && item.ward === ward)
      ),
    }));
  };

  const goToPage = (page) => {
    handlePageChange(page, buildFilters());
  };

  const handleExport = async () => {
    if (!exportType) return;
    setExporting(true);
    try {
      await exportUserEmails?.(buildFilters(), exportType);
      setExportModalOpen(false);
    } finally {
      setExporting(false);
    }
  };

  const selectedLabel =
    ACTIVITY_OPTIONS.find((opt) => opt.value === activityFilter)?.label || "All users";

  const advancedCount = useMemo(() => countActiveAdvanced(advancedApplied), [advancedApplied]);
  const hasAnyFilter = Boolean(searchTerm.trim() || activityFilter || advancedCount > 0);

  const setDraft = (key, value) => {
    setAdvancedDraft((prev) => ({ ...prev, [key]: value }));
  };

  return {
    searchTerm,
    setSearchTerm,
    activityFilter,
    filterDropdownOpen,
    setFilterDropdownOpen,
    advancedOpen,
    setAdvancedOpen,
    advancedDraft,
    exporting,
    exportModalOpen,
    setExportModalOpen,
    exportType,
    setExportType,
    addressQuery,
    setAddressQuery,
    addressMenuOpen,
    setAddressMenuOpen,
    addressMunicipality,
    setAddressMunicipality,
    addressWard,
    setAddressWard,
    listLoading,
    filteredMunicipalities,
    selectedLabel,
    advancedCount,
    hasAnyFilter,
    handleActivityFilter,
    applyAdvanced,
    clearAdvanced,
    addAddress,
    removeAddress,
    goToPage,
    handleExport,
    setDraft,
  };
}
