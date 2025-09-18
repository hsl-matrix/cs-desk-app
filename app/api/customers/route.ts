import { NextResponse } from "next/server";

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  tier: "VIP" | "Gold" | "Silver" | "Bronze";
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  lastContactDate: string;
  totalPurchases: number;
  region: string;
}

// Generate mock customer data
function generateMockCustomers(count: number): Customer[] {
  const customers: Customer[] = [];
  const names = [
    "김철수", "이영희", "박민수", "최지영", "정대호",
    "강민경", "조성우", "윤서진", "임재현", "한지민",
    "서준호", "김나연", "이도현", "박서연", "최준혁",
    "정유진", "강태양", "조미래", "윤하늘", "임소정"
  ];
  const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산"];
  const tiers: Customer["tier"][] = ["VIP", "Gold", "Silver", "Bronze"];
  const statuses: Customer["status"][] = ["active", "inactive", "pending"];

  for (let i = 0; i < count; i++) {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365));

    const lastContactDate = new Date();
    lastContactDate.setDate(lastContactDate.getDate() - Math.floor(Math.random() * 30));

    customers.push({
      id: `cust-${i + 1}`,
      customerId: `CS${String(10000 + i).padStart(6, "0")}`,
      name: names[i % names.length] + (Math.floor(i / names.length) > 0 ? ` ${Math.floor(i / names.length)}` : ""),
      email: `customer${i + 1}@example.com`,
      phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      tier: tiers[Math.floor(Math.random() * tiers.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      registrationDate: randomDate.toISOString().split('T')[0],
      lastContactDate: lastContactDate.toISOString().split('T')[0],
      totalPurchases: Math.floor(Math.random() * 5000000) + 100000,
      region: regions[Math.floor(Math.random() * regions.length)]
    });
  }

  return customers;
}

// Generate 500 mock customers for the entire dataset
const allCustomers = generateMockCustomers(500);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const tier = searchParams.get("tier") || "";
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  // Filter customers
  let filteredCustomers = [...allCustomers];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredCustomers = filteredCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.customerId.toLowerCase().includes(searchLower) ||
        customer.phone.includes(search)
    );
  }

  if (tier) {
    filteredCustomers = filteredCustomers.filter(
      (customer) => customer.tier === tier
    );
  }

  if (status) {
    filteredCustomers = filteredCustomers.filter(
      (customer) => customer.status === status
    );
  }

  // Sort customers
  filteredCustomers.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "email":
        comparison = a.email.localeCompare(b.email);
        break;
      case "tier":
        comparison = a.tier.localeCompare(b.tier);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "totalPurchases":
        comparison = a.totalPurchases - b.totalPurchases;
        break;
      case "registrationDate":
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Paginate results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Calculate pagination metadata
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Return response
  return NextResponse.json({
    data: paginatedCustomers,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
}