import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type {
  AppData,
  BudgetItem,
  DefectEntry,
  DefectInput,
  HistoryEvent,
  NewOrderInput,
  OrderPatch,
  OSStatus,
  ServiceOrder,
  Settings,
} from './types';
import { colors, STATUS_META } from './theme';
import { addDays, formatCurrency, uid } from './format';
import { itemTotal, nextOSNumber } from './os-utils';
import { createInitialData } from './seed';
import { loadAppData, normalizeAppData, saveAppData } from './storage';

interface DataContextValue {
  ready: boolean;
  orders: ServiceOrder[];
  defects: DefectEntry[];
  settings: Settings;
  createOrder: (input: NewOrderInput) => ServiceOrder;
  updateOrder: (id: string, patch: OrderPatch, event?: HistoryEvent) => void;
  changeStatus: (id: string, status: OSStatus) => void;
  deleteOrder: (id: string) => void;
  addBudgetItem: (orderId: string, input: Omit<BudgetItem, 'id'>) => BudgetItem;
  updateBudgetItem: (orderId: string, item: BudgetItem) => void;
  removeBudgetItem: (orderId: string, itemId: string) => void;
  createDefect: (input: DefectInput) => DefectEntry;
  updateDefect: (id: string, input: DefectInput) => void;
  deleteDefect: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceData: (data: AppData) => void;
  resetData: () => void;
  getSnapshot: () => AppData;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => createInitialData());
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);

  useEffect(() => {
    let mounted = true;

    loadAppData()
      .then((loaded) => {
        if (!mounted) return;
        dataRef.current = loaded;
        setData(loaded);
        setReady(true);
      })
      .catch((error) => {
        console.warn('Falha ao inicializar os dados.', error);
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAppData(data).catch((error) => {
      console.warn('Falha ao salvar os dados do TecInfo.', error);
    });
  }, [data, ready]);

  const commit = useCallback((updater: (previous: AppData) => AppData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
  }, []);

  const createOrder = useCallback(
    (input: NewOrderInput): ServiceOrder => {
      const now = new Date().toISOString();
      const deadlineDays = Math.max(
        0,
        Math.round(dataRef.current.settings.defaultDeadlineDays),
      );
      const order: ServiceOrder = {
        id: uid('os_'),
        number: nextOSNumber(dataRef.current.orders),
        createdAt: now,
        updatedAt: now,
        status: 'orcamento',
        clientName: input.clientName.trim(),
        clientPhone: input.clientPhone.trim(),
        clientAddress: input.clientAddress.trim(),
        brand: input.brand.trim(),
        model: input.model.trim(),
        serial: input.serial.trim(),
        accessories: [...input.accessories],
        reportedDefect: input.reportedDefect.trim(),
        diagnosis: '',
        budgetItems: [],
        budgetNotes: '',
        servicePerformed: input.servicePerformed.trim(),
        internalNotes: input.internalNotes.trim(),
        warrantyDays: dataRef.current.settings.defaultWarrantyDays,
        dueDate: deadlineDays > 0 ? addDays(now, deadlineDays) : undefined,
        warrantyPending: false,
        warrantyPendingNote: '',
        history: [
          {
            id: uid('h_'),
            at: now,
            title: 'OS aberta',
            detail: 'Equipamento registrado com status Orçamento.',
          },
        ],
      };

      commit((previous) => ({ ...previous, orders: [order, ...previous.orders] }));
      return order;
    },
    [commit],
  );

  const updateOrder = useCallback(
    (id: string, patch: OrderPatch, event?: HistoryEvent) => {
      const now = new Date().toISOString();
      commit((previous) => ({
        ...previous,
        orders: previous.orders.map((order) => {
          if (order.id !== id) return order;
          return {
            ...order,
            ...patch,
            updatedAt: now,
            history: event ? [...order.history, event] : order.history,
          };
        }),
      }));
    },
    [commit],
  );

  const changeStatus = useCallback(
    (id: string, status: OSStatus) => {
      const current = dataRef.current.orders.find((order) => order.id === id);
      if (!current || current.status === status) return;

      const now = new Date().toISOString();
      const patch: OrderPatch = { status };

      if (status === 'autorizado' && !current.approvedAt) patch.approvedAt = now;
      if (status === 'pronto') patch.completedAt = now;
      if (status === 'recusado') patch.canceledAt = now;
      else if (current.status === 'recusado') patch.canceledAt = undefined;

      const title =
        status === 'pronto'
          ? 'OS finalizada'
          : status === 'recusado'
            ? 'OS cancelada'
            : `Status: ${STATUS_META[status].label}`;

      updateOrder(id, patch, {
        id: uid('h_'),
        at: now,
        title,
        detail: `De "${STATUS_META[current.status].label}" para "${STATUS_META[status].label}".`,
      });
    },
    [updateOrder],
  );

  const deleteOrder = useCallback(
    (id: string) => {
      commit((previous) => ({
        ...previous,
        orders: previous.orders.filter((order) => order.id !== id),
      }));
    },
    [commit],
  );

  const addBudgetItem = useCallback(
    (orderId: string, input: Omit<BudgetItem, 'id'>): BudgetItem => {
      const item: BudgetItem = { ...input, id: uid('item_') };
      const now = new Date().toISOString();
      commit((previous) => ({
        ...previous,
        orders: previous.orders.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            budgetItems: [...order.budgetItems, item],
            updatedAt: now,
            history: [
              ...order.history,
              {
                id: uid('h_'),
                at: now,
                title: 'Item adicionado ao orçamento',
                detail: `${item.kind === 'peca' ? 'Peça' : 'Serviço'}: ${item.description} — ${formatCurrency(itemTotal(item))}`,
              },
            ],
          };
        }),
      }));
      return item;
    },
    [commit],
  );

  const updateBudgetItem = useCallback(
    (orderId: string, item: BudgetItem) => {
      const now = new Date().toISOString();
      commit((previous) => ({
        ...previous,
        orders: previous.orders.map((order) => {
          if (order.id !== orderId) return order;
          const exists = order.budgetItems.some((candidate) => candidate.id === item.id);
          if (!exists) return order;
          return {
            ...order,
            budgetItems: order.budgetItems.map((candidate) =>
              candidate.id === item.id ? item : candidate,
            ),
            updatedAt: now,
            history: [
              ...order.history,
              {
                id: uid('h_'),
                at: now,
                title: 'Item do orçamento atualizado',
                detail: `${item.kind === 'peca' ? 'Peça' : 'Serviço'}: ${item.description} — ${formatCurrency(itemTotal(item))}`,
              },
            ],
          };
        }),
      }));
    },
    [commit],
  );

  const removeBudgetItem = useCallback(
    (orderId: string, itemId: string) => {
      const now = new Date().toISOString();
      commit((previous) => ({
        ...previous,
        orders: previous.orders.map((order) => {
          if (order.id !== orderId) return order;
          const item = order.budgetItems.find((candidate) => candidate.id === itemId);
          if (!item) return order;
          return {
            ...order,
            budgetItems: order.budgetItems.filter((candidate) => candidate.id !== itemId),
            updatedAt: now,
            history: [
              ...order.history,
              {
                id: uid('h_'),
                at: now,
                title: 'Item removido do orçamento',
                detail: `${item.kind === 'peca' ? 'Peça' : 'Serviço'}: ${item.description}`,
              },
            ],
          };
        }),
      }));
    },
    [commit],
  );

  const createDefect = useCallback(
    (input: DefectInput): DefectEntry => {
      const now = new Date().toISOString();
      const defect: DefectEntry = {
        ...input,
        id: uid('def_'),
        title: input.title.trim(),
        symptoms: input.symptoms.trim(),
        causes: input.causes.trim(),
        solution: input.solution.trim(),
        tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
      };
      commit((previous) => ({ ...previous, defects: [defect, ...previous.defects] }));
      return defect;
    },
    [commit],
  );

  const updateDefect = useCallback(
    (id: string, input: DefectInput) => {
      const now = new Date().toISOString();
      commit((previous) => ({
        ...previous,
        defects: previous.defects.map((defect) =>
          defect.id === id
            ? {
                ...defect,
                ...input,
                title: input.title.trim(),
                symptoms: input.symptoms.trim(),
                causes: input.causes.trim(),
                solution: input.solution.trim(),
                tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
                updatedAt: now,
              }
            : defect,
        ),
      }));
    },
    [commit],
  );

  const deleteDefect = useCallback(
    (id: string) => {
      commit((previous) => ({
        ...previous,
        defects: previous.defects.filter((defect) => defect.id !== id),
      }));
    },
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      commit((previous) => {
        const merged: Settings = { ...previous.settings, ...patch };
        merged.defaultWarrantyDays = Math.max(
          0,
          Math.round(
            Number.isFinite(merged.defaultWarrantyDays) ? merged.defaultWarrantyDays : 90,
          ),
        );
        merged.defaultDeadlineDays = Math.max(
          0,
          Math.min(
            365,
            Math.round(
              Number.isFinite(merged.defaultDeadlineDays) ? merged.defaultDeadlineDays : 7,
            ),
          ),
        );
        return { ...previous, settings: merged };
      });
    },
    [commit],
  );

  const replaceData = useCallback(
    (next: AppData) => {
      commit(() => normalizeAppData(next));
    },
    [commit],
  );

  const resetData = useCallback(() => {
    commit(() => createInitialData());
  }, [commit]);

  const getSnapshot = useCallback(() => dataRef.current, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      orders: data.orders,
      defects: data.defects,
      settings: data.settings,
      createOrder,
      updateOrder,
      changeStatus,
      deleteOrder,
      addBudgetItem,
      updateBudgetItem,
      removeBudgetItem,
      createDefect,
      updateDefect,
      deleteDefect,
      updateSettings,
      replaceData,
      resetData,
      getSnapshot,
    }),
    [
      ready,
      data,
      createOrder,
      updateOrder,
      changeStatus,
      deleteOrder,
      addBudgetItem,
      updateBudgetItem,
      removeBudgetItem,
      createDefect,
      updateDefect,
      deleteDefect,
      updateSettings,
      replaceData,
      resetData,
      getSnapshot,
    ],
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <View style={styles.logo}>
          <Ionicons name="print-outline" size={36} color={colors.white} />
        </View>
        <Text style={styles.brand}>TecInfo</Text>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Carregando seus registros...</Text>
      </View>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData precisa ser usado dentro de DataProvider.');
  }
  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 28,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
});
