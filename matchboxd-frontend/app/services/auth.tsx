import React from 'react';

interface Props {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitText: string;
  fields: { name: string; type: string; placeholder: string }[];
}

export default function AuthForm({ title, onSubmit, submitText, fields }: Props) {
  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map((field) => (
          <input
            key={field.name}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
          />
        ))}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          {submitText}
        </button>
      </form>
    </div>
  );
}
