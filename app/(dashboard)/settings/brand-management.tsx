"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface Brand {
  id: string;
  name: string;
  description: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

// Mock data
const initialBrands: Brand[] = [
  {
    id: "brand-1",
    name: "메인 브랜드",
    description: "회사의 주력 브랜드입니다.",
    code: "MAIN",
    isActive: true,
    createdAt: "2024-01-15",
  },
  {
    id: "brand-2",
    name: "서브 브랜드 A",
    description: "프리미엄 라인 브랜드",
    code: "SUB_A",
    isActive: true,
    createdAt: "2024-02-20",
  },
  {
    id: "brand-3",
    name: "서브 브랜드 B",
    description: "이코노미 라인 브랜드",
    code: "SUB_B",
    isActive: false,
    createdAt: "2024-03-10",
  },
];

export function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    isActive: true,
  });

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        description: brand.description,
        code: brand.code,
        isActive: brand.isActive,
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: "",
        description: "",
        code: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveBrand = () => {
    if (!formData.name || !formData.code) return;

    if (editingBrand) {
      // 수정
      setBrands((prev) =>
        prev.map((brand) =>
          brand.id === editingBrand.id
            ? { ...brand, ...formData }
            : brand
        )
      );
    } else {
      // 추가
      const newBrand: Brand = {
        id: `brand-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setBrands((prev) => [...prev, newBrand]);
    }

    setIsDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      code: "",
      isActive: true,
    });
  };

  const handleDeleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((brand) => brand.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setBrands((prev) =>
      prev.map((brand) =>
        brand.id === id ? { ...brand, isActive: !brand.isActive } : brand
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">브랜드 관리</h3>
          <p className="text-sm text-muted-foreground">
            시스템에서 사용할 브랜드를 등록하고 관리합니다.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              브랜드 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? "브랜드 수정" : "새 브랜드 추가"}
              </DialogTitle>
              <DialogDescription>
                브랜드 정보를 입력하세요. 브랜드 코드는 시스템에서 고유해야 합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="brand-name">브랜드명 *</Label>
                <Input
                  id="brand-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 메인 브랜드"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brand-code">브랜드 코드 *</Label>
                <Input
                  id="brand-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="예: MAIN"
                  className="uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brand-description">설명</Label>
                <Textarea
                  id="brand-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="브랜드에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="brand-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="brand-active">활성화 상태</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveBrand}>
                {editingBrand ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>브랜드명</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  등록된 브랜드가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {brand.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {brand.code}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <span className="truncate text-sm text-muted-foreground">
                      {brand.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={brand.isActive ? "default" : "secondary"}
                      className={
                        brand.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : ""
                      }
                    >
                      {brand.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>{brand.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={brand.isActive}
                        onCheckedChange={() => handleToggleActive(brand.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(brand)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBrand(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}