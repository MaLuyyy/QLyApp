export const getCategoryFromName = (name: string) => {
  switch (name) {
    case 'all':
      return 'Tất cả';
    case 'foods':
      return 'Đồ ăn';
    case 'drinks':
      return 'Đồ uống';
    case 'fruits':
      return 'Hoa quả';
    case 'snacks':
      return 'Đồ ăn nhanh';
    case 'other' :
      return 'Khác';
  }
};

export const getStatusOrderFromName = (status: string) => {
  switch(status){
    case 'all':
      return 'Tất cả';
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'delivering':
      return 'Đang giao hàng';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled' :
      return 'Đã hủy';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#facc15'; // vàng
    case 'confirmed':
      return '#fb923c'; // cam
    case 'delivering':
      return '#93c5fd'; // xanh dương nhạt
    case 'completed':
      return '#4ade80'; // xanh lá
    case 'cancelled':
      return '#f87171'; // đỏ
    default:
      return '#9ca3af'; // xám
  }
};

export const getRoleStaffFromName = (role: string) => {
  switch(role){
    case 'all':
      return 'Tất cả';
    case 'chef':
      return 'Đầu bếp';
    case 'accountant':
      return 'Kế toán';
    case 'shipper':
      return 'Giao hàng';
    case 'cleaner':
      return 'Tạp vụ';
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'manager':
      return { bg: '#f3e8ff', color: '#7e22ce' }; // tím
    case 'chef':
      return { bg: '#ffedd5', color: '#c2410c' }; // cam
    case 'accountant':
      return { bg: '#dbeafe', color: '#1d4ed8' }; // xanh dương
    case 'shipper':
      return { bg: '#dcfce7', color: '#15803d' }; // xanh lá
    case 'cleaner':
      return { bg: '#fef9c3', color: '#a16207' }; // vàng nhạt
    default:
      return { bg: '#f3f4f6', color: '#111827' }; // xám mặc định
  }
};

export const getGenderColor = (role: string) => {
  switch (role) {
    case 'Nam':
      return { bg: '#e0f2fe', color: '#0284c7' }; // tím
    case 'Nữ':
      return { bg: '#fce7f3', color: '#db2777' }; // cam
    default:
      return { bg: '#f3f4f6', color: '#111827' }; // xám mặc định
  }
};
  
  