"use client";

import { useState } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CategoryList } from "@/components/categories/CategoryList";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { EditCategoryModal } from "@/components/categories/EditCategoryModal";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import type { Category } from "@/types/category";

function CategoriesPageContent() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const handleAdd = () => {
    setAddModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCloseModals = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <>
      <CategoryList
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddCategoryModal open={addModalOpen} onClose={handleCloseModals} />

      <EditCategoryModal
        open={editModalOpen}
        onClose={handleCloseModals}
        category={selectedCategory}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onClose={handleCloseModals}
        category={selectedCategory}
      />
    </>
  );
}

export default function CategoriesPage() {
  return (
    <QueryProvider>
      <CategoriesPageContent />
    </QueryProvider>
  );
}
